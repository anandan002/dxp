import { Injectable, Logger } from '@nestjs/common';
import {
  ClaimSummary,
  ClaimFilters,
  EOBDetail,
  Appeal,
  AppealSubmission,
  ClaimDashboardMetrics,
  FhirPaginatedResult,
  FhirMoney,
} from '@dxp/contracts';
import { ClaimsPort } from '../ports/claims.port';
import { FhirClient, FhirBundle } from '../../fhir-core/fhir-client.service';

@Injectable()
export class FhirClaimAdapter extends ClaimsPort {
  private readonly logger = new Logger(FhirClaimAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async listClaims(
    tenantId: string,
    memberId: string,
    filters: ClaimFilters,
  ): Promise<FhirPaginatedResult<ClaimSummary>> {
    const params: Record<string, string> = {
      patient: memberId,
      _count: String(filters.pageSize || 20),
    };
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;
    if (filters.dateFrom) params['date'] = `ge${filters.dateFrom}`;
    if (filters.dateTo) params['date'] = params['date']
      ? `${params['date']}&date=le${filters.dateTo}`
      : `le${filters.dateTo}`;
    if (filters.page && filters.pageSize) {
      params._offset = String((filters.page - 1) * filters.pageSize);
    }

    const bundle = await this.fhir.search<Record<string, unknown>>('ExplanationOfBenefit', params);
    return {
      entry: (bundle.entry || []).map(e => this.mapToClaimSummary(e.resource)),
      total: bundle.total || 0,
      link: bundle.link,
    };
  }

  async getClaimDetail(tenantId: string, claimId: string): Promise<ClaimSummary> {
    const resource = await this.fhir.read<Record<string, unknown>>('Claim', claimId);
    return this.mapToClaimSummary(resource);
  }

  async getEOB(tenantId: string, claimId: string): Promise<EOBDetail> {
    const eob = await this.fhir.read<Record<string, unknown>>('ExplanationOfBenefit', claimId);
    return this.mapToEOBDetail(eob);
  }

  async submitAppeal(
    tenantId: string,
    claimId: string,
    data: AppealSubmission,
  ): Promise<Appeal> {
    // Model an appeal as a FHIR ClaimResponse with a review-action extension
    const resource = {
      resourceType: 'ClaimResponse',
      status: 'active',
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }] },
      use: 'claim',
      request: { reference: `Claim/${claimId}` },
      disposition: data.reason,
      extension: [
        {
          url: 'http://dxp.health/fhir/StructureDefinition/appeal-narrative',
          valueString: data.narrative,
        },
      ],
    };

    const created = await this.fhir.create<Record<string, unknown>>('ClaimResponse', resource);
    return {
      id: String(created.id || ''),
      claimId,
      status: 'submitted',
      submittedDate: new Date().toISOString(),
      reason: data.reason,
    };
  }

  async getDashboardMetrics(tenantId: string): Promise<ClaimDashboardMetrics> {
    // Aggregate from EOB search
    const [allBundle, deniedBundle] = await Promise.all([
      this.fhir.search<Record<string, unknown>>('ExplanationOfBenefit', { _summary: 'count' }),
      this.fhir.search<Record<string, unknown>>('ExplanationOfBenefit', { status: 'denied', _summary: 'count' }),
    ]);

    const total = allBundle.total || 0;
    const denied = deniedBundle.total || 0;
    const zero: FhirMoney = { value: 0, currency: 'USD' };

    return {
      totalClaims: total,
      pendingClaims: 0,
      deniedClaims: denied,
      denialRate: total > 0 ? denied / total : 0,
      avgTurnaroundDays: 0,
      autoAdjudicationRate: 0,
      totalBilled: zero,
      totalPaid: zero,
    };
  }

  // ── Mappers ────────────────────────────────────────────────────

  private mapToClaimSummary(raw: Record<string, unknown>): ClaimSummary {
    const zero: FhirMoney = { value: 0, currency: 'USD' };
    const type = this.extractCoding(raw, 'type');
    // FHIR EOB: total is an array of {category, amount} — extract by category code
    const billedAmount = this.extractTotalByCategory(raw, 'submitted') || zero;
    const allowedAmount = this.extractTotalByCategory(raw, 'benefit') || zero;
    // FHIR EOB: payment.amount for what was actually paid
    const payment = raw.payment as Record<string, unknown> | undefined;
    const paidAmount = payment?.amount
      ? this.extractMoney(payment, 'amount') || zero
      : allowedAmount;
    // provider.reference is "Practitioner/uuid" — show readable ID
    const providerRef = (raw.provider as Record<string, unknown>)?.reference as string || '';
    const providerDisplay = (raw.provider as Record<string, unknown>)?.display as string
      || providerRef.split('/').pop() || '';

    return {
      id: String(raw.id || ''),
      claimNumber: String(raw.id || '').slice(0, 8).toUpperCase(),
      type: (type?.code as ClaimSummary['type']) || 'professional',
      status: this.mapStatus(String(raw.status || 'active')),
      serviceDate: this.extractDate(raw, 'billablePeriod') || '',
      provider: providerDisplay,
      billedAmount,
      allowedAmount,
      paidAmount,
      memberOwes: zero,
      primaryDiagnosis: this.extractDiagnosis(raw),
    };
  }

  private mapToEOBDetail(raw: Record<string, unknown>): EOBDetail {
    const claim = this.mapToClaimSummary(raw);
    const items = (raw.item as Record<string, unknown>[]) || [];
    const zero: FhirMoney = { value: 0, currency: 'USD' };

    return {
      id: String(raw.id || ''),
      claim,
      serviceLines: items.map((item, idx) => ({
        sequence: (item.sequence as number) || idx + 1,
        procedureCode: {
          code: this.extractCoding(item, 'productOrService')?.code || '',
          display: this.extractCoding(item, 'productOrService')?.display,
        },
        serviceDate: String(item.servicedDate || ''),
        // FHIR EOB item: net is billed amount (unitPrice × qty)
        billedAmount: this.extractMoney(item, 'net') || zero,
        allowedAmount: this.extractAdjudication(item, 'benefit') || zero,
        paidAmount: this.extractAdjudication(item, 'submitted') || zero,
        memberOwes: zero,
      })),
      paymentDate: raw.payment
        ? String((raw.payment as Record<string, unknown>).date || '')
        : undefined,
    };
  }

  private mapStatus(fhirStatus: string): ClaimSummary['status'] {
    const map: Record<string, ClaimSummary['status']> = {
      active: 'submitted',
      'entered-in-error': 'denied',
      cancelled: 'denied',
    };
    return map[fhirStatus] || 'submitted';
  }

  private extractCoding(
    obj: Record<string, unknown>,
    field: string,
  ): { code: string; display?: string } | undefined {
    const cc = obj[field] as Record<string, unknown> | undefined;
    if (!cc) return undefined;
    const coding = (cc.coding as Record<string, unknown>[]) || [];
    return coding[0] ? { code: String(coding[0].code), display: coding[0].display as string } : undefined;
  }

  private extractDisplay(obj: Record<string, unknown>, field: string): string | undefined {
    const ref = obj[field] as Record<string, unknown> | undefined;
    return ref?.display as string | undefined;
  }

  private extractDate(obj: Record<string, unknown>, field: string): string | undefined {
    const period = obj[field] as Record<string, unknown> | undefined;
    return period?.start as string | undefined;
  }

  private extractMoney(obj: Record<string, unknown>, field: string): FhirMoney | undefined {
    const m = obj[field] as Record<string, unknown> | undefined;
    if (!m) return undefined;
    return { value: Number(m.value || 0), currency: String(m.currency || 'USD') };
  }

  private extractTotalByCategory(obj: Record<string, unknown>, category: string): FhirMoney | undefined {
    const totals = (obj.total as Record<string, unknown>[]) || [];
    const match = totals.find(t => {
      const cc = t.category as Record<string, unknown>;
      const coding = (cc?.coding as Record<string, unknown>[]) || [];
      return coding.some(c => c.code === category);
    });
    if (!match) return undefined;
    const amount = match.amount as Record<string, unknown>;
    return amount ? { value: Number(amount.value || 0), currency: String(amount.currency || 'USD') } : undefined;
  }

  private extractAdjudication(
    obj: Record<string, unknown>,
    category: string,
  ): FhirMoney | undefined {
    const adjs = (obj.adjudication as Record<string, unknown>[]) || [];
    const match = adjs.find(a => {
      const cc = a.category as Record<string, unknown>;
      const coding = (cc?.coding as Record<string, unknown>[]) || [];
      return coding.some(c => c.code === category);
    });
    if (!match) return undefined;
    const amount = match.amount as Record<string, unknown>;
    return amount ? { value: Number(amount.value || 0), currency: String(amount.currency || 'USD') } : undefined;
  }

  private extractDiagnosis(obj: Record<string, unknown>): string | undefined {
    const diags = (obj.diagnosis as Record<string, unknown>[]) || [];
    if (diags.length === 0) return undefined;
    const first = diags[0].diagnosisCodeableConcept as Record<string, unknown> | undefined;
    return first?.text as string | undefined;
  }
}
