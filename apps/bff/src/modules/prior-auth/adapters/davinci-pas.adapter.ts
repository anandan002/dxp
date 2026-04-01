import { Injectable, Logger } from '@nestjs/common';
import {
  PriorAuthSummary,
  PriorAuthDetail,
  PAQueueFilters,
  CRDResponse,
  DTRTemplate,
  PASubmission,
  PADecision,
  PADashboardMetrics,
  FhirPaginatedResult,
  FhirMoney,
  PAStatus,
} from '@dxp/contracts';
import { PriorAuthPort } from '../ports/prior-auth.port';
import { FhirClient, FhirBundle } from '../../fhir-core/fhir-client.service';

/**
 * Da Vinci PAS (Prior Authorization Support) adapter.
 * Maps to FHIR R4 Claim (use=preauthorization) + ClaimResponse resources,
 * following the HL7 Da Vinci PAS Implementation Guide.
 */
@Injectable()
export class DaVinciPASAdapter extends PriorAuthPort {
  private readonly logger = new Logger(DaVinciPASAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async listPriorAuths(
    tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>> {
    const params: Record<string, string> = {
      use: 'preauthorization',
      _count: String(filters.pageSize || 20),
      _sort: '-created',
      _include: 'Claim:patient',
    };
    if (filters.status) params.status = this.mapStatusToFhir(filters.status);
    if (filters.urgency) params.priority = filters.urgency;
    if (filters.dateFrom) params.created = `ge${filters.dateFrom}`;
    if (filters.dateTo) params.created = params.created
      ? `${params.created}&created=le${filters.dateTo}`
      : `le${filters.dateTo}`;
    if (filters.page && filters.pageSize) {
      params._offset = String((filters.page - 1) * filters.pageSize);
    }

    const bundle = await this.fhir.search<Record<string, unknown>>('Claim', params);
    const patientNames = this.buildPatientNameMap(bundle);

    return {
      entry: (bundle.entry || [])
        .filter(e => e.resource.resourceType === 'Claim')
        .map(e => this.mapToSummary(e.resource, patientNames)),
      total: bundle.total || 0,
      link: bundle.link,
    };
  }

  async getPriorAuthDetail(tenantId: string, id: string): Promise<PriorAuthDetail> {
    const resource = await this.fhir.read<Record<string, unknown>>('Claim', id);
    return this.mapToDetail(resource);
  }

  async checkRequirement(
    tenantId: string,
    serviceCode: string,
    memberId: string,
  ): Promise<CRDResponse> {
    // CRD (Coverage Requirements Discovery) — check if prior auth is required
    // In production this calls the payer's CRD endpoint via CDS Hooks
    const bundle = await this.fhir.search<Record<string, unknown>>(
      'CoverageEligibilityResponse',
      { patient: memberId, _sort: '-created', _count: '1' },
    );

    const entries = (bundle.entry || []);
    const hasAuth = entries.length > 0;

    return {
      requiresAuth: hasAuth,
      serviceCode: { code: serviceCode },
      coverageInfo: hasAuth ? 'Prior authorization may be required for this service.' : undefined,
      documentationRequired: hasAuth ? ['Clinical notes', 'Lab results'] : undefined,
    };
  }

  async getDocTemplate(tenantId: string, code: string): Promise<DTRTemplate> {
    // DTR (Documentation Templates and Rules) — fetch questionnaire for a service
    const bundle = await this.fhir.search<Record<string, unknown>>(
      'Questionnaire',
      { code, status: 'active', _count: '1' },
    );

    const entries = (bundle.entry || []);
    if (entries.length === 0) {
      return {
        questionnaireId: '',
        title: `Documentation for ${code}`,
        questions: [
          { linkId: '1', text: 'Clinical justification', type: 'string', required: true },
          { linkId: '2', text: 'Date of service', type: 'date', required: true },
          { linkId: '3', text: 'Supporting documentation', type: 'attachment', required: false },
        ],
      };
    }

    const q = entries[0].resource;
    const items = (q.item as Record<string, unknown>[]) || [];

    return {
      questionnaireId: String(q.id || ''),
      title: String(q.title || q.name || ''),
      questions: items.map(item => ({
        linkId: String(item.linkId || ''),
        text: String(item.text || ''),
        type: this.mapQuestionType(String(item.type || 'string')),
        required: (item.required as boolean) || false,
        options: this.extractAnswerOptions(item),
      })),
    };
  }

  async submitRequest(tenantId: string, data: PASubmission): Promise<PriorAuthSummary> {
    // Build a FHIR Claim with use=preauthorization per Da Vinci PAS
    const resource: Record<string, unknown> = {
      resourceType: 'Claim',
      status: 'active',
      use: 'preauthorization',
      type: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }],
      },
      patient: { reference: `Patient/${data.memberId}` },
      created: new Date().toISOString(),
      priority: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/processpriority', code: data.urgency }],
      },
      item: [
        {
          sequence: 1,
          productOrService: {
            coding: [{ code: data.serviceCode }],
          },
          servicedPeriod: data.requestedServiceDate,
          quantity: data.quantity ? { value: data.quantity } : undefined,
        },
      ],
      supportingInfo: data.notes
        ? [{ sequence: 1, category: { coding: [{ code: 'info' }] }, valueString: data.notes }]
        : undefined,
    };

    const created = await this.fhir.create<Record<string, unknown>>('Claim', resource);
    return this.mapToSummary(created);
  }

  async decide(tenantId: string, id: string, decision: PADecision): Promise<PriorAuthDetail> {
    // Create a ClaimResponse representing the payer decision
    const response: Record<string, unknown> = {
      resourceType: 'ClaimResponse',
      status: 'active',
      type: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }],
      },
      use: 'preauthorization',
      request: { reference: `Claim/${id}` },
      outcome: this.mapDecisionToOutcome(decision.decision),
      disposition: decision.rationale,
      preAuthRef: id,
      preAuthPeriod: decision.expirationDate
        ? { start: new Date().toISOString(), end: decision.expirationDate }
        : undefined,
    };

    await this.fhir.create('ClaimResponse', response);

    // Return updated detail
    return this.getPriorAuthDetail(tenantId, id);
  }

  async getDashboardMetrics(tenantId: string): Promise<PADashboardMetrics> {
    const [allBundle, pendingBundle, approvedBundle, deniedBundle] = await Promise.all([
      this.fhir.search<Record<string, unknown>>('Claim', { use: 'preauthorization', _summary: 'count' }),
      this.fhir.search<Record<string, unknown>>('Claim', { use: 'preauthorization', status: 'active', _summary: 'count' }),
      this.fhir.search<Record<string, unknown>>('ClaimResponse', { use: 'preauthorization', outcome: 'complete', _summary: 'count' }),
      this.fhir.search<Record<string, unknown>>('ClaimResponse', { use: 'preauthorization', outcome: 'error', _summary: 'count' }),
    ]);

    const total = allBundle.total || 0;
    const approved = approvedBundle.total || 0;
    const denied = deniedBundle.total || 0;

    return {
      totalRequests: total,
      pendingReview: pendingBundle.total || 0,
      approved,
      denied,
      automationRate: 0,
      avgTurnaroundHoursUrgent: 0,
      avgTurnaroundHoursRoutine: 0,
      topRequestedServices: [],
    };
  }

  async getReviewQueue(
    tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>> {
    // Review queue = pending items only
    const queueFilters: PAQueueFilters = { ...filters, status: 'in-review' };
    return this.listPriorAuths(tenantId, queueFilters);
  }

  // ── Mappers ────────────────────────────────────────────────────

  private buildPatientNameMap(bundle: FhirBundle<Record<string, unknown>>): Map<string, string> {
    const map = new Map<string, string>();
    for (const entry of bundle.entry || []) {
      if (entry.resource.resourceType !== 'Patient') continue;
      const id = String(entry.resource.id || '');
      const names = (entry.resource.name as Record<string, unknown>[]) || [];
      if (names.length === 0) continue;
      const n = names[0];
      const given = (n.given as string[]) || [];
      const family = (n.family as string) || '';
      const fullName = [...given, family].filter(Boolean).join(' ');
      if (fullName) map.set(`Patient/${id}`, fullName);
    }
    return map;
  }

  private mapToSummary(raw: Record<string, unknown>, patientNames?: Map<string, string>): PriorAuthSummary {
    const item = ((raw.item as Record<string, unknown>[]) || [])[0];
    const priority = raw.priority as Record<string, unknown> | undefined;
    const priorityCoding = (priority?.coding as Record<string, unknown>[]) || [];

    return {
      id: String(raw.id || ''),
      authNumber: String(raw.id || ''),
      status: this.mapFhirToStatus(String(raw.status || 'active')),
      urgency: (priorityCoding[0]?.code as PriorAuthSummary['urgency']) || 'routine',
      serviceCode: {
        code: this.extractItemCode(item) || '',
      },
      serviceDescription: this.extractItemDisplay(item) || '',
      requestingProvider: this.extractDisplay(raw, 'provider') || '',
      memberName: this.extractDisplay(raw, 'patient') || patientNames?.get(this.extractReferenceStr(raw, 'patient') || '') || '',
      memberId: this.extractReference(raw, 'patient') || '',
      submittedDate: String(raw.created || ''),
      daysInQueue: raw.created
        ? Math.floor((Date.now() - new Date(String(raw.created)).getTime()) / 86_400_000)
        : 0,
    };
  }

  private mapToDetail(raw: Record<string, unknown>): PriorAuthDetail {
    const summary = this.mapToSummary(raw);
    const item = ((raw.item as Record<string, unknown>[]) || [])[0];
    const supportingInfo = (raw.supportingInfo as Record<string, unknown>[]) || [];

    return {
      ...summary,
      clinicalReason: { code: '' },
      requestedServiceDate: item?.servicedPeriod as PriorAuthDetail['requestedServiceDate'] || { start: '' },
      quantity: (item?.quantity as Record<string, unknown>)?.value as number | undefined,
      supportingDocuments: [],
      timeline: [
        { date: String(raw.created || ''), event: 'Request submitted' },
      ],
    };
  }

  private mapStatusToFhir(status: PAStatus): string {
    const map: Record<PAStatus, string> = {
      draft: 'draft',
      submitted: 'active',
      'in-review': 'active',
      approved: 'active',
      denied: 'active',
      pended: 'active',
      cancelled: 'cancelled',
      expired: 'active',
    };
    return map[status] || 'active';
  }

  private mapFhirToStatus(fhirStatus: string): PAStatus {
    const map: Record<string, PAStatus> = {
      draft: 'draft',
      active: 'submitted',
      cancelled: 'cancelled',
      'entered-in-error': 'cancelled',
    };
    return map[fhirStatus] || 'submitted';
  }

  private mapDecisionToOutcome(decision: PADecision['decision']): string {
    const map: Record<string, string> = {
      approved: 'complete',
      denied: 'error',
      pended: 'partial',
    };
    return map[decision] || 'queued';
  }

  private mapQuestionType(fhirType: string): DTRTemplate['questions'][0]['type'] {
    const map: Record<string, DTRTemplate['questions'][0]['type']> = {
      string: 'string',
      boolean: 'boolean',
      choice: 'choice',
      date: 'date',
      attachment: 'attachment',
      text: 'string',
      integer: 'string',
      decimal: 'string',
    };
    return map[fhirType] || 'string';
  }

  private extractItemCode(item: Record<string, unknown> | undefined): string | undefined {
    if (!item) return undefined;
    const ps = item.productOrService as Record<string, unknown> | undefined;
    const coding = (ps?.coding as Record<string, unknown>[]) || [];
    return coding[0]?.code as string | undefined;
  }

  private extractItemDisplay(item: Record<string, unknown> | undefined): string | undefined {
    if (!item) return undefined;
    const ps = item.productOrService as Record<string, unknown> | undefined;
    const coding = (ps?.coding as Record<string, unknown>[]) || [];
    return (coding[0]?.display as string) || (ps?.text as string) || undefined;
  }

  private extractDisplay(obj: Record<string, unknown>, field: string): string | undefined {
    const ref = obj[field] as Record<string, unknown> | undefined;
    return ref?.display as string | undefined;
  }

  private extractReference(obj: Record<string, unknown>, field: string): string | undefined {
    const ref = obj[field] as Record<string, unknown> | undefined;
    const refStr = ref?.reference as string | undefined;
    return refStr ? refStr.split('/').pop() : undefined;
  }

  private extractReferenceStr(obj: Record<string, unknown>, field: string): string | undefined {
    const ref = obj[field] as Record<string, unknown> | undefined;
    return ref?.reference as string | undefined;
  }

  private extractAnswerOptions(
    item: Record<string, unknown>,
  ): { code: string; display: string }[] | undefined {
    const options = (item.answerOption as Record<string, unknown>[]) || [];
    if (options.length === 0) return undefined;
    return options.map(o => {
      const coding = o.valueCoding as Record<string, unknown> | undefined;
      return {
        code: String(coding?.code || ''),
        display: String(coding?.display || coding?.code || ''),
      };
    });
  }
}
