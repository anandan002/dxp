import { Injectable, Logger } from '@nestjs/common';
import {
  HEDISMeasure,
  QualityCareGap,
  QualityDashboardMetrics,
} from '@dxp/contracts';
import {
  QualityMeasuresPort,
  QualityFilters,
  QualityCareGapFilters,
  SubmissionStatus,
} from '../ports/quality-measures.port';
import { FhirClient, FhirBundle } from '../../fhir-core/fhir-client.service';

// HEDIS measure definitions with benchmarks (NCQA 2025 benchmarks)
const HEDIS_MEASURES: Record<string, { name: string; domain: HEDISMeasure['domain']; benchmark: number }> = {
  BCS: { name: 'Breast Cancer Screening', domain: 'effectiveness', benchmark: 0.77 },
  CCS: { name: 'Cervical Cancer Screening', domain: 'effectiveness', benchmark: 0.72 },
  COL: { name: 'Colorectal Cancer Screening', domain: 'effectiveness', benchmark: 0.72 },
  CBP: { name: 'Controlling High Blood Pressure', domain: 'effectiveness', benchmark: 0.65 },
  'CDC-HbA1c': { name: 'Comprehensive Diabetes Care - HbA1c Testing', domain: 'effectiveness', benchmark: 0.89 },
  FUA: { name: 'Follow-Up After ED Visit for Alcohol Use', domain: 'access', benchmark: 0.15 },
  AMM: { name: 'Antidepressant Medication Management', domain: 'effectiveness', benchmark: 0.57 },
};

@Injectable()
export class HedisEngineAdapter extends QualityMeasuresPort {
  private readonly logger = new Logger(HedisEngineAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async getMeasures(
    tenantId: string,
    filters: QualityFilters,
  ): Promise<HEDISMeasure[]> {
    return this.computeMeasuresFromIndividual(filters);
  }

  async getCareGaps(
    tenantId: string,
    filters: QualityCareGapFilters,
  ): Promise<QualityCareGap[]> {
    const params: Record<string, string> = {
      _count: '500',
    };
    if (filters.memberId) params.patient = filters.memberId;
    if (filters.status) params.status = filters.status === 'open' ? 'pending' : 'complete';

    const bundle = await this.fhir.search<Record<string, unknown>>('MeasureReport', params);
    const gaps: QualityCareGap[] = [];

    for (const entry of bundle.entry || []) {
      const gap = this.mapToQualityCareGap(entry.resource);
      if (!gap) continue;
      if (filters.status && gap.status !== filters.status) continue;
      if (filters.measure && gap.measureCode !== filters.measure) continue;
      if (filters.gapType && gap.gapType !== filters.gapType) continue;
      gaps.push(gap);
    }

    return gaps;
  }

  async triggerOutreach(
    tenantId: string,
    gapId: string,
    channel: 'sms' | 'phone' | 'app-push' | 'mail',
  ): Promise<QualityCareGap> {
    const report = await this.fhir.read<Record<string, unknown>>('MeasureReport', gapId);

    // Add outreach extension to the MeasureReport
    const extensions = (report.extension as Record<string, unknown>[]) || [];
    extensions.push({
      url: 'http://dxp.health/fhir/StructureDefinition/outreach-attempt',
      extension: [
        { url: 'channel', valueCode: channel },
        { url: 'date', valueDateTime: new Date().toISOString() },
        { url: 'status', valueCode: 'in-progress' },
      ],
    });

    const updated = { ...report, extension: extensions };
    await this.fhir.update<Record<string, unknown>>('MeasureReport', gapId, updated);

    const gap = this.mapToQualityCareGap(updated);
    return gap || {
      id: gapId,
      memberId: '',
      memberName: '',
      measure: '',
      measureCode: '',
      gapType: 'screening',
      description: '',
      status: 'open',
      dueDate: '',
      outreachStatus: 'in-progress',
      lastOutreachChannel: channel,
    };
  }

  async getSubmissionStatus(tenantId: string): Promise<SubmissionStatus[]> {
    const measures = await this.getMeasures(tenantId, {});
    const now = new Date();
    const yearEnd = `${now.getFullYear()}-12-31`;

    return measures.map(m => ({
      measureCode: m.code,
      measureName: m.name,
      status: m.rate >= m.benchmark ? 'accepted' as const : 'draft' as const,
      dueDate: yearEnd,
    }));
  }

  // ── Computation from individual reports ───────────────────────

  private async computeMeasuresFromIndividual(
    filters: QualityFilters,
  ): Promise<HEDISMeasure[]> {
    const bundle = await this.fhir.search<Record<string, unknown>>('MeasureReport', {
      _count: '1000',
    });

    const byMeasure: Record<string, { num: number; den: number }> = {};

    for (const entry of bundle.entry || []) {
      const report = entry.resource;
      const measureRef = String(report.measure || '');
      const measureCode = this.extractMeasureCode(measureRef);
      if (!measureCode) continue;

      if (!byMeasure[measureCode]) byMeasure[measureCode] = { num: 0, den: 0 };
      byMeasure[measureCode].den++;

      const groups = (report.group as Record<string, unknown>[]) || [];
      const firstGroup = groups[0] as Record<string, unknown> | undefined;
      const populations = (firstGroup?.population as Record<string, unknown>[]) || [];
      const numerator = populations.find(p => {
        const code = p.code as Record<string, unknown> | undefined;
        const coding = (code?.coding as Record<string, unknown>[]) || [];
        return coding.some(c => c.code === 'numerator');
      });
      if (numerator && (numerator.count as number) > 0) {
        byMeasure[measureCode].num++;
      }
    }

    const measures: HEDISMeasure[] = [];
    let idx = 0;
    for (const [code, stats] of Object.entries(byMeasure)) {
      const def = HEDIS_MEASURES[code];
      if (!def) continue;
      if (filters.domain && def.domain !== filters.domain) continue;
      if (filters.measureCode && code !== filters.measureCode) continue;

      const rate = stats.den > 0 ? stats.num / stats.den : 0;
      measures.push({
        id: `measure-${idx++}`,
        code,
        name: def.name,
        description: def.name,
        domain: def.domain,
        numerator: stats.num,
        denominator: stats.den,
        rate: Math.round(rate * 1000) / 1000,
        benchmark: def.benchmark,
        trend: 0,
        starRating: this.computeStarRating(rate, def.benchmark),
      });
    }

    return measures;
  }

  private computeStarRating(rate: number, benchmark: number): number {
    const ratio = rate / benchmark;
    if (ratio >= 1.1) return 5;
    if (ratio >= 1.0) return 4;
    if (ratio >= 0.85) return 3;
    if (ratio >= 0.7) return 2;
    return 1;
  }

  // ── Mappers ───────────────────────────────────────────────────

  private mapToHEDISMeasure(raw: Record<string, unknown>): HEDISMeasure {
    const measureRef = String(raw.measure || '');
    const code = this.extractMeasureCode(measureRef) || '';
    const def = HEDIS_MEASURES[code] || { name: code, domain: 'effectiveness' as const, benchmark: 0 };

    const groups = (raw.group as Record<string, unknown>[]) || [];
    const firstGroup = groups[0] as Record<string, unknown> | undefined;
    const measureScore = firstGroup?.measureScore as Record<string, unknown> | undefined;

    const rate = Number(measureScore?.value || 0);

    return {
      id: String(raw.id || ''),
      code,
      name: def.name,
      description: def.name,
      domain: def.domain,
      numerator: 0,
      denominator: 0,
      rate,
      benchmark: def.benchmark,
      trend: 0,
      starRating: this.computeStarRating(rate, def.benchmark),
    };
  }

  private mapToQualityCareGap(raw: Record<string, unknown>): QualityCareGap | null {
    const groups = (raw.group as Record<string, unknown>[]) || [];
    const firstGroup = groups[0] as Record<string, unknown> | undefined;
    if (!firstGroup) return null;

    const populations = (firstGroup.population as Record<string, unknown>[]) || [];
    const numerator = populations.find(p => {
      const code = p.code as Record<string, unknown> | undefined;
      const coding = (code?.coding as Record<string, unknown>[]) || [];
      return coding.some(c => c.code === 'numerator');
    });

    const isOpen = numerator && (numerator.count as number) === 0;
    if (!isOpen) return null; // Only return open gaps

    const measureRef = String(raw.measure || '');
    const measureCode = this.extractMeasureCode(measureRef) || '';
    const def = HEDIS_MEASURES[measureCode];

    const subject = raw.subject as Record<string, unknown> | undefined;
    const patientRef = String(subject?.reference || '').replace('Patient/', '');
    const period = raw.period as Record<string, unknown> | undefined;

    // Determine gap type from measure
    const gapType = this.inferGapType(measureCode);

    // Check outreach extensions
    const extensions = (raw.extension as Record<string, unknown>[]) || [];
    const outreachExt = extensions.find(e =>
      String(e.url || '') === 'http://dxp.health/fhir/StructureDefinition/outreach-attempt',
    );
    const outreachStatus = outreachExt ? 'in-progress' as const : 'not-started' as const;
    const lastChannel = this.extractOutreachChannel(outreachExt);

    return {
      id: String(raw.id || ''),
      memberId: patientRef,
      memberName: '',
      measure: def?.name || measureCode,
      measureCode,
      gapType,
      description: `${def?.name || measureCode} gap open`,
      status: 'open',
      dueDate: String(period?.end || ''),
      outreachStatus,
      lastOutreachChannel: lastChannel,
    };
  }

  private inferGapType(measureCode: string): QualityCareGap['gapType'] {
    const typeMap: Record<string, QualityCareGap['gapType']> = {
      BCS: 'screening',
      CCS: 'screening',
      COL: 'screening',
      CBP: 'visit',
      'CDC-HbA1c': 'lab',
      FUA: 'visit',
      AMM: 'medication',
    };
    return typeMap[measureCode] || 'screening';
  }

  private extractMeasureCode(measureRef: string): string | undefined {
    // Handles: "Measure/BCS", "Measure/hedis-bcs", "http://example.org/Measure/BCS"
    const parts = measureRef.split('/');
    const raw = parts[parts.length - 1] || undefined;
    if (!raw) return undefined;
    // Normalize hedis-xxx prefixes → upper codes used in HEDIS_MEASURES map
    const normalized = raw.replace(/^hedis-/i, '').toUpperCase();
    // Special case: hedis-cdc-hba1c → CDC-HbA1c
    if (normalized === 'CDC-HBA1C') return 'CDC-HbA1c';
    return normalized;
  }

  private extractOutreachChannel(
    ext: Record<string, unknown> | undefined,
  ): QualityCareGap['lastOutreachChannel'] {
    if (!ext) return undefined;
    const nested = (ext.extension as Record<string, unknown>[]) || [];
    const channelExt = nested.find(e => String(e.url || '') === 'channel');
    return channelExt?.valueCode as QualityCareGap['lastOutreachChannel'];
  }
}
