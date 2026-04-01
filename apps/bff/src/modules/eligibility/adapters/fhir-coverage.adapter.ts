import { Injectable, Logger } from '@nestjs/common';
import {
  BenefitCategory,
  Accumulator,
  CostEstimate,
  DigitalIdCard,
  FhirMoney,
} from '@dxp/contracts';
import { EligibilityPort } from '../ports/eligibility.port';
import { FhirClient } from '../../fhir-core/fhir-client.service';

// Standard benefit categories derived from Coverage plan type
const BENEFIT_CATEGORIES: Record<string, { priorAuth: boolean; notes?: string }> = {
  'Medical':       { priorAuth: true,  notes: 'Inpatient and outpatient medical services' },
  'Preventive':    { priorAuth: false, notes: 'Annual wellness visits, screenings, immunizations' },
  'Emergency':     { priorAuth: false, notes: 'Emergency room and urgent care visits' },
  'Prescription':  { priorAuth: true,  notes: 'Formulary tier-based cost sharing applies' },
  'Mental Health': { priorAuth: true,  notes: 'Behavioral health and substance use services' },
  'Lab & Imaging': { priorAuth: false, notes: 'Lab work, X-ray, MRI, CT — in-network preferred' },
};

@Injectable()
export class FhirCoverageAdapter extends EligibilityPort {
  private readonly logger = new Logger(FhirCoverageAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async getBenefits(tenantId: string, memberId: string): Promise<BenefitCategory[]> {
    const bundle = await this.fhir.search<Record<string, unknown>>(
      'Coverage',
      { beneficiary: memberId, status: 'active' },
    );

    const entries = bundle.entry || [];
    if (entries.length === 0) return [];

    const coverage = entries[0].resource;
    const costToBeneficiary = (coverage.costToBeneficiary as Record<string, unknown>[]) || [];

    // Map Coverage.costToBeneficiary to a lookup by type code
    const costByType = new Map<string, FhirMoney>();
    for (const cost of costToBeneficiary) {
      const typeCode = this.extractFirstCode(cost.type as Record<string, unknown>);
      const money = cost.valueMoney as Record<string, unknown> | undefined;
      if (typeCode && money) {
        costByType.set(typeCode, { value: Number(money.value || 0), currency: String(money.currency || 'USD') });
      }
    }

    const copay = costByType.get('copay') || costByType.get('gpvisit');
    const specialistCopay = costByType.get('specialist');

    return Object.entries(BENEFIT_CATEGORIES).map(([category, meta]) => ({
      category,
      network: 'in-network' as const,
      copay: category === 'Medical' ? specialistCopay || copay : copay,
      priorAuthRequired: meta.priorAuth,
      coverageNotes: meta.notes,
    }));
  }

  async getAccumulators(tenantId: string, memberId: string): Promise<Accumulator[]> {
    const yearStart = new Date().getFullYear() + '-01-01';
    const yearEnd   = new Date().getFullYear() + '-12-31';

    const [coverageBundle, eobBundle] = await Promise.all([
      this.fhir.search<Record<string, unknown>>(
        'Coverage',
        { beneficiary: memberId, status: 'active' },
      ),
      this.fhir.search<Record<string, unknown>>(
        'ExplanationOfBenefit',
        { patient: memberId, _count: '500' },
      ),
    ]);

    const coverage = (coverageBundle.entry || [])[0]?.resource;
    if (!coverage) return [];

    const costToBeneficiary = (coverage.costToBeneficiary as Record<string, unknown>[]) || [];
    const costByType = new Map<string, number>();
    for (const cost of costToBeneficiary) {
      const code = this.extractFirstCode(cost.type as Record<string, unknown>);
      const money = cost.valueMoney as Record<string, unknown> | undefined;
      if (code && money) costByType.set(code, Number(money.value || 0));
    }

    // Sum what member has paid year-to-date from EOBs
    let memberPaidYTD = 0;
    for (const entry of eobBundle.entry || []) {
      const eob = entry.resource;
      const totals = (eob.total as Record<string, unknown>[]) || [];
      const memberTotal = totals.find(t => {
        const cat = t.category as Record<string, unknown> | undefined;
        const coding = (cat?.coding as Record<string, unknown>[]) || [];
        return coding.some(c => c.code === 'memberliability' || c.code === 'patientpay');
      });
      if (memberTotal) {
        const amount = memberTotal.amount as Record<string, unknown>;
        memberPaidYTD += Number(amount?.value || 0);
      }
    }

    const currency = 'USD';
    const accumulators: Accumulator[] = [];

    // Deductible
    const deductibleLimit = costByType.get('deductible') ?? 0;
    const deductibleUsed = Math.min(memberPaidYTD * 0.3, deductibleLimit); // approximate
    accumulators.push({
      type: 'deductible',
      network: 'in-network',
      limit: { value: deductibleLimit, currency },
      used:  { value: Math.round(deductibleUsed * 100) / 100, currency },
      remaining: { value: Math.max(0, deductibleLimit - deductibleUsed), currency },
      period: { start: yearStart, end: yearEnd },
    });

    // Out-of-pocket max (typically 3-5x deductible for MA plans)
    const oopLimit = costByType.get('out-of-pocket') ?? Math.max(deductibleLimit * 4, 3000);
    const oopUsed = Math.min(memberPaidYTD, oopLimit);
    accumulators.push({
      type: 'out-of-pocket-max',
      network: 'in-network',
      limit: { value: oopLimit, currency },
      used:  { value: Math.round(oopUsed * 100) / 100, currency },
      remaining: { value: Math.max(0, oopLimit - oopUsed), currency },
      period: { start: yearStart, end: yearEnd },
    });

    return accumulators;
  }

  async getCostEstimate(
    tenantId: string,
    memberId: string,
    procedureCode: string,
    providerId?: string,
  ): Promise<CostEstimate> {
    // Get coverage to understand cost sharing
    const bundle = await this.fhir.search<Record<string, unknown>>(
      'Coverage',
      { beneficiary: memberId, status: 'active' },
    );

    const coverage = (bundle.entry || [])[0]?.resource;
    const costToBeneficiary = (coverage?.costToBeneficiary as Record<string, unknown>[]) || [];
    const copayEntry = costToBeneficiary.find(c =>
      this.extractFirstCode(c.type as Record<string, unknown>) === 'copay',
    );
    const copayMoney = copayEntry?.valueMoney as Record<string, unknown> | undefined;
    const copay: FhirMoney = copayMoney
      ? { value: Number(copayMoney.value || 0), currency: String(copayMoney.currency || 'USD') }
      : { value: 20, currency: 'USD' };

    // Estimate based on procedure category — real payer would call a pricer service
    const estimatedTotal: FhirMoney = { value: 250, currency: 'USD' };
    const planPays: FhirMoney = { value: 230 - copay.value, currency: 'USD' };

    return {
      procedureCode: { code: procedureCode },
      procedureDescription: procedureCode,
      providerName: providerId,
      estimatedTotal,
      planPays: { value: Math.max(0, planPays.value), currency: 'USD' },
      memberPays: copay,
      copay,
      coinsurance: { value: 0, currency: 'USD' },
      deductibleApplied: { value: 0, currency: 'USD' },
      disclaimer: 'Estimate only. Actual costs depend on services rendered and network status.',
    };
  }

  async getIdCard(tenantId: string, memberId: string): Promise<DigitalIdCard> {
    const [coverageBundle, patientBundle] = await Promise.all([
      this.fhir.search<Record<string, unknown>>(
        'Coverage',
        { beneficiary: memberId, status: 'active' },
      ),
      this.fhir.read<Record<string, unknown>>('Patient', memberId),
    ]);

    const entries = coverageBundle.entry || [];
    if (entries.length === 0) {
      throw new Error(`No active coverage found for member ${memberId}`);
    }

    const coverage = entries[0].resource;
    const cls = (coverage.class as Record<string, unknown>[]) || [];

    const findClass = (code: string) =>
      cls.find(c => this.extractFirstCode(c.type as Record<string, unknown>) === code);

    const groupClass  = findClass('group');
    const rxBinClass  = findClass('rxbin');
    const rxPcnClass  = findClass('rxpcn');
    const rxGroupClass = findClass('rxgroup');

    const period = coverage.period as Record<string, unknown> | undefined;
    const planTypeCoding = (coverage.type as Record<string, unknown> | undefined);
    const planCoding = (planTypeCoding?.coding as Record<string, unknown>[]) || [];
    const planType = (planCoding[0]?.code as string) || 'PPO';
    const planName = (planTypeCoding?.text as string) || (planCoding[0]?.display as string) || planType;

    // Resolve patient name from Patient resource
    const memberName = this.formatPatientName(patientBundle);

    return {
      memberId: String(coverage.subscriberId || memberId),
      memberName,
      groupNumber: (groupClass?.value as string) || '',
      planName,
      planType: planType as DigitalIdCard['planType'],
      rxBin:   (rxBinClass?.value as string) || '',
      rxPcn:   (rxPcnClass?.value as string) || '',
      rxGroup: (rxGroupClass?.value as string) || '',
      payerName: (coverage.payor as Record<string, unknown>[])?.[0]?.display as string || 'Meridian Health Plan',
      payerPhone: '1-800-555-0199',
      effectiveDate: (period?.start as string) || '',
    };
  }

  // ── Helpers ────────────────────────────────────────────────────

  private formatPatientName(patient: Record<string, unknown>): string {
    const names = (patient.name as Record<string, unknown>[]) || [];
    if (names.length === 0) return '';
    const name = names[0];
    const given = (name.given as string[]) || [];
    const family = (name.family as string) || '';
    const prefix = (name.prefix as string[]) || [];
    return [...prefix, ...given, family].filter(Boolean).join(' ');
  }

  private extractFirstCode(cc: Record<string, unknown> | undefined): string | undefined {
    if (!cc) return undefined;
    const coding = (cc.coding as Record<string, unknown>[]) || [];
    return coding[0]?.code as string | undefined;
  }
}
