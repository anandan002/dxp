import { Injectable, Logger } from '@nestjs/common';
import {
  PopulationMetrics,
  WorklistEntry,
  RiskBreakdown,
  CareGap,
  RiskTier,
  FhirCoding,
} from '@dxp/contracts';
import {
  RiskStratificationPort,
  WorklistParams,
  CareGapFilters,
} from '../ports/risk-stratification.port';
import { FhirClient, FhirBundle } from '../../fhir-core/fhir-client.service';

// HCC risk coefficient categories (simplified CMS-HCC V28)
const HCC_WEIGHTS: Record<string, number> = {
  'E11': 0.105,   // Type 2 Diabetes
  'I50': 0.368,   // Heart Failure
  'J44': 0.335,   // COPD
  'N18': 0.237,   // CKD
  'C50': 0.146,   // Breast Cancer
  'F32': 0.309,   // Depression
  'I10': 0.0,     // Hypertension (not HCC-mapped)
};

@Injectable()
export class HccEngineAdapter extends RiskStratificationPort {
  private readonly logger = new Logger(HccEngineAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async getPopulationDashboard(tenantId: string): Promise<PopulationMetrics> {
    const [patientBundle, conditionBundle, gapBundle] = await Promise.all([
      this.fhir.search<Record<string, unknown>>('Patient', { _summary: 'count' }),
      this.fhir.search<Record<string, unknown>>('Condition', {
        'clinical-status': 'active',
        _count: '500',
      }),
      this.fhir.search<Record<string, unknown>>('MeasureReport', {
        _count: '500',
      }),
    ]);

    const totalMembers = patientBundle.total || 0;
    const conditions = (conditionBundle.entry || []).map(e => e.resource);
    const riskScores = this.computePopulationRisk(conditions, totalMembers);

    const gapEntries = (gapBundle.entry || []).map(e => e.resource);
    const openGaps = gapEntries.filter(g => {
      const group = (g.group as Record<string, unknown>[]) || [];
      const firstGroup = group[0] as Record<string, unknown> | undefined;
      const pop = (firstGroup?.population as Record<string, unknown>[]) || [];
      const numerator = pop.find(p => {
        const code = p.code as Record<string, unknown> | undefined;
        const coding = (code?.coding as Record<string, unknown>[]) || [];
        return coding.some(c => c.code === 'numerator');
      });
      return numerator && (numerator.count as number) === 0;
    });

    return {
      totalMembers,
      byRiskTier: riskScores.tiers,
      avgRiskScore: riskScores.avgScore,
      totalOpenGaps: openGaps.length,
      gapClosureRate: gapEntries.length > 0
        ? (gapEntries.length - openGaps.length) / gapEntries.length
        : 0,
      readmissionRate: 0,
      edUtilizationRate: 0,
    };
  }

  async getRiskWorklist(
    tenantId: string,
    params: WorklistParams,
  ): Promise<WorklistEntry[]> {
    const conditionBundle = await this.fhir.search<Record<string, unknown>>('Condition', {
      'clinical-status': 'active',
      _count: '500',
      _include: 'Condition:patient',
    });

    // Collect included Patient resources for name lookup
    const patientNames = new Map<string, string>();
    for (const entry of conditionBundle.entry || []) {
      if (entry.resource.resourceType === 'Patient') {
        const id = String(entry.resource.id || '');
        patientNames.set(`Patient/${id}`, this.formatPatientName(entry.resource));
      }
    }

    const byPatient = this.groupConditionsByPatient(conditionBundle);
    const entries: WorklistEntry[] = [];

    for (const [patientRef, conditions] of Object.entries(byPatient)) {
      const score = this.computeRiskScore(conditions);
      const tier = this.scoreTier(score);

      if (params.tier && tier !== params.tier) continue;

      entries.push({
        memberId: patientRef.replace('Patient/', ''),
        memberName: patientNames.get(patientRef) || '',
        overallScore: score,
        tier,
        hccCount: conditions.filter(c => this.getHccWeight(c) > 0).length,
        openGaps: 0,
        lastUpdated: new Date().toISOString(),
        primaryCondition: this.extractConditionDisplay(conditions[0]) || '',
        urgentGaps: [],
      });
    }

    entries.sort((a, b) => b.overallScore - a.overallScore);

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    return entries.slice((page - 1) * pageSize, page * pageSize);
  }

  async getMemberRiskProfile(
    tenantId: string,
    memberId: string,
  ): Promise<RiskBreakdown> {
    const [conditionBundle, eobBundle] = await Promise.all([
      this.fhir.search<Record<string, unknown>>('Condition', {
        patient: memberId,
        'clinical-status': 'active',
      }),
      this.fhir.search<Record<string, unknown>>('ExplanationOfBenefit', {
        patient: memberId,
        _count: '100',
      }),
    ]);

    const conditions = (conditionBundle.entry || []).map(e => e.resource);
    const eobs = (eobBundle.entry || []).map(e => e.resource);

    const clinicalScore = this.computeRiskScore(conditions);
    const claimsScore = this.computeClaimsRisk(eobs);
    const overall = clinicalScore * 0.6 + claimsScore * 0.4;

    return {
      memberId,
      claimsScore: Math.round(claimsScore * 100) / 100,
      clinicalScore: Math.round(clinicalScore * 100) / 100,
      sdohScore: 0,
      overallScore: Math.round(overall * 100) / 100,
      conditions: conditions.map(c => ({
        code: this.extractConditionCoding(c),
        hccCategory: this.getHccCategory(c),
        documented: true,
      })),
      sdohFactors: [],
    };
  }

  async getCareGaps(
    tenantId: string,
    filters: CareGapFilters,
  ): Promise<CareGap[]> {
    const params: Record<string, string> = { _count: '200' };
    if (filters.memberId) params.patient = filters.memberId;

    const bundle = await this.fhir.search<Record<string, unknown>>('MeasureReport', params);
    const gaps: CareGap[] = [];

    for (const entry of bundle.entry || []) {
      const report = entry.resource;
      const gap = this.mapMeasureReportToGap(report);
      if (gap && (!filters.status || gap.status === filters.status)) {
        gaps.push(gap);
      }
    }

    return gaps;
  }

  async closeCareGap(tenantId: string, gapId: string): Promise<CareGap> {
    const report = await this.fhir.read<Record<string, unknown>>('MeasureReport', gapId);
    // Update the MeasureReport status to complete
    const updated = { ...report, status: 'complete' };
    await this.fhir.update<Record<string, unknown>>('MeasureReport', gapId, updated);

    return {
      id: gapId,
      memberId: this.extractPatientRef(report),
      memberName: '',
      measure: this.extractMeasureRef(report),
      measureCode: '',
      description: 'Care gap closed',
      status: 'closed',
      closedDate: new Date().toISOString(),
      outreachAttempts: 0,
    };
  }

  // ── Risk computation ──────────────────────────────────────────

  private computePopulationRisk(
    conditions: Record<string, unknown>[],
    totalMembers: number,
  ): { tiers: PopulationMetrics['byRiskTier']; avgScore: number } {
    const byPatient = this.groupConditionsByPatient({ entry: conditions.map(c => ({ resource: c })) } as FhirBundle<Record<string, unknown>>);
    let totalScore = 0;
    const tierCounts: Record<RiskTier, number> = { low: 0, moderate: 0, high: 0, critical: 0 };

    for (const patientConditions of Object.values(byPatient)) {
      const score = this.computeRiskScore(patientConditions);
      totalScore += score;
      tierCounts[this.scoreTier(score)]++;
    }

    const scored = Object.keys(byPatient).length;
    const unscored = totalMembers - scored;
    tierCounts.low += unscored;

    return {
      tiers: (['low', 'moderate', 'high', 'critical'] as RiskTier[]).map(tier => ({
        tier,
        count: tierCounts[tier],
        percentage: totalMembers > 0 ? tierCounts[tier] / totalMembers : 0,
      })),
      avgScore: scored > 0 ? Math.round((totalScore / scored) * 100) / 100 : 0,
    };
  }

  private computeRiskScore(conditions: Record<string, unknown>[]): number {
    let base = 0.5; // demographic base
    for (const c of conditions) {
      base += this.getHccWeight(c);
    }
    return Math.min(base, 5.0);
  }

  private computeClaimsRisk(eobs: Record<string, unknown>[]): number {
    if (eobs.length === 0) return 0;
    // Simple heuristic: more claims = higher risk
    const score = Math.min(eobs.length * 0.15, 3.0);
    return Math.round(score * 100) / 100;
  }

  private scoreTier(score: number): RiskTier {
    if (score >= 3.0) return 'critical';
    if (score >= 2.0) return 'high';
    if (score >= 1.0) return 'moderate';
    return 'low';
  }

  private getHccWeight(condition: Record<string, unknown>): number {
    const coding = this.extractConditionCoding(condition);
    const prefix = coding.code.substring(0, 3);
    return HCC_WEIGHTS[prefix] || 0;
  }

  private getHccCategory(condition: Record<string, unknown>): string | undefined {
    const coding = this.extractConditionCoding(condition);
    const prefix = coding.code.substring(0, 3);
    return HCC_WEIGHTS[prefix] !== undefined ? `HCC-${prefix}` : undefined;
  }

  // ── Helpers ───────────────────────────────────────────────────

  private formatPatientName(patient: Record<string, unknown>): string {
    const names = (patient.name as Record<string, unknown>[]) || [];
    if (names.length === 0) return '';
    const name = names[0];
    const given = (name.given as string[]) || [];
    const family = (name.family as string) || '';
    return [...given, family].filter(Boolean).join(' ');
  }

  private groupConditionsByPatient(
    bundle: FhirBundle<Record<string, unknown>>,
  ): Record<string, Record<string, unknown>[]> {
    const map: Record<string, Record<string, unknown>[]> = {};
    for (const entry of bundle.entry || []) {
      const subject = entry.resource.subject as Record<string, unknown> | undefined;
      const ref = String(subject?.reference || 'unknown');
      if (!map[ref]) map[ref] = [];
      map[ref].push(entry.resource);
    }
    return map;
  }

  private extractConditionCoding(condition: Record<string, unknown>): FhirCoding {
    const cc = condition.code as Record<string, unknown> | undefined;
    const coding = (cc?.coding as Record<string, unknown>[]) || [];
    const first = coding[0] || {};
    return {
      system: String(first.system || ''),
      code: String(first.code || ''),
      display: first.display as string | undefined,
    };
  }

  private extractConditionDisplay(condition: Record<string, unknown>): string | undefined {
    const cc = condition.code as Record<string, unknown> | undefined;
    if (cc?.text) return String(cc.text);
    const coding = (cc?.coding as Record<string, unknown>[]) || [];
    return coding[0]?.display as string | undefined;
  }

  private mapMeasureReportToGap(report: Record<string, unknown>): CareGap | null {
    const groups = (report.group as Record<string, unknown>[]) || [];
    const firstGroup = groups[0] as Record<string, unknown> | undefined;
    if (!firstGroup) return null;

    const populations = (firstGroup.population as Record<string, unknown>[]) || [];
    const numerator = populations.find(p => {
      const code = p.code as Record<string, unknown> | undefined;
      const coding = (code?.coding as Record<string, unknown>[]) || [];
      return coding.some(c => c.code === 'numerator');
    });

    const isOpen = numerator && (numerator.count as number) === 0;

    return {
      id: String(report.id || ''),
      memberId: this.extractPatientRef(report),
      memberName: '',
      measure: this.extractMeasureRef(report),
      measureCode: '',
      description: String(firstGroup.code
        ? (firstGroup.code as Record<string, unknown>).text || ''
        : ''),
      status: isOpen ? 'open' : 'closed',
      outreachAttempts: 0,
    };
  }

  private extractPatientRef(report: Record<string, unknown>): string {
    const subject = report.subject as Record<string, unknown> | undefined;
    const ref = String(subject?.reference || '');
    return ref.replace('Patient/', '');
  }

  private extractMeasureRef(report: Record<string, unknown>): string {
    return String(report.measure || '');
  }
}
