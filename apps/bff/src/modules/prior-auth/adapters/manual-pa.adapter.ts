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
} from '@dxp/contracts';
import { PriorAuthPort } from '../ports/prior-auth.port';

/**
 * Manual Prior Auth adapter — returns mock/stub data.
 * Useful for development, demos, and environments without a FHIR server.
 */
@Injectable()
export class ManualPAAdapter extends PriorAuthPort {
  private readonly logger = new Logger(ManualPAAdapter.name);

  async listPriorAuths(
    _tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>> {
    const now = new Date().toISOString();
    const items: PriorAuthSummary[] = [
      {
        id: 'pa-001',
        authNumber: 'AUTH-2024-0001',
        status: 'in-review',
        urgency: 'routine',
        serviceCode: { code: '27447', display: 'Total knee replacement' },
        serviceDescription: 'Total knee replacement',
        requestingProvider: 'Dr. Smith',
        memberName: 'Jane Doe',
        memberId: 'member-001',
        submittedDate: now,
        daysInQueue: 3,
      },
      {
        id: 'pa-002',
        authNumber: 'AUTH-2024-0002',
        status: 'approved',
        urgency: 'urgent',
        serviceCode: { code: '70553', display: 'MRI Brain with contrast' },
        serviceDescription: 'MRI Brain with contrast',
        requestingProvider: 'Dr. Jones',
        memberName: 'John Smith',
        memberId: 'member-002',
        submittedDate: now,
        daysInQueue: 1,
        decisionDate: now,
      },
    ];

    const filtered = filters.status
      ? items.filter(i => i.status === filters.status)
      : items;

    return {
      entry: filtered,
      total: filtered.length,
    };
  }

  async getPriorAuthDetail(_tenantId: string, id: string): Promise<PriorAuthDetail> {
    const now = new Date().toISOString();
    return {
      id,
      authNumber: `AUTH-${id}`,
      status: 'in-review',
      urgency: 'routine',
      serviceCode: { code: '27447', display: 'Total knee replacement' },
      serviceDescription: 'Total knee replacement',
      requestingProvider: 'Dr. Smith',
      memberName: 'Jane Doe',
      memberId: 'member-001',
      submittedDate: now,
      daysInQueue: 3,
      clinicalReason: { code: 'M17.11', display: 'Primary osteoarthritis, right knee' },
      requestedServiceDate: { start: now },
      supportingDocuments: [],
      timeline: [
        { date: now, event: 'Request submitted', actor: 'Dr. Smith' },
        { date: now, event: 'Under clinical review', actor: 'Nurse Reviewer' },
      ],
    };
  }

  async checkRequirement(
    _tenantId: string,
    serviceCode: string,
    _memberId: string,
  ): Promise<CRDResponse> {
    return {
      requiresAuth: true,
      serviceCode: { code: serviceCode },
      coverageInfo: 'Prior authorization is required for this service.',
      documentationRequired: ['Clinical notes', 'Imaging results', 'Treatment plan'],
      alternativeSuggestions: [],
    };
  }

  async getDocTemplate(_tenantId: string, code: string): Promise<DTRTemplate> {
    return {
      questionnaireId: `q-${code}`,
      title: `Prior Auth Documentation for ${code}`,
      questions: [
        { linkId: '1', text: 'Clinical justification', type: 'string', required: true },
        { linkId: '2', text: 'Has conservative treatment been attempted?', type: 'boolean', required: true },
        { linkId: '3', text: 'Requested date of service', type: 'date', required: true },
        { linkId: '4', text: 'Supporting clinical documents', type: 'attachment', required: false },
      ],
    };
  }

  async submitRequest(_tenantId: string, data: PASubmission): Promise<PriorAuthSummary> {
    const now = new Date().toISOString();
    return {
      id: `pa-${Date.now()}`,
      authNumber: `AUTH-${Date.now()}`,
      status: 'submitted',
      urgency: data.urgency,
      serviceCode: { code: data.serviceCode },
      serviceDescription: data.serviceCode,
      requestingProvider: '',
      memberName: '',
      memberId: data.memberId,
      submittedDate: now,
      daysInQueue: 0,
    };
  }

  async decide(_tenantId: string, id: string, decision: PADecision): Promise<PriorAuthDetail> {
    const detail = await this.getPriorAuthDetail(_tenantId, id);
    return {
      ...detail,
      status: decision.decision === 'approved' ? 'approved' : decision.decision === 'denied' ? 'denied' : 'pended',
      decisionDate: new Date().toISOString(),
      decisionRationale: decision.rationale,
    };
  }

  async getDashboardMetrics(_tenantId: string): Promise<PADashboardMetrics> {
    return {
      totalRequests: 42,
      pendingReview: 8,
      approved: 28,
      denied: 4,
      automationRate: 0.65,
      avgTurnaroundHoursUrgent: 4,
      avgTurnaroundHoursRoutine: 48,
      topRequestedServices: [
        { code: '27447', description: 'Total knee replacement', count: 12 },
        { code: '70553', description: 'MRI Brain with contrast', count: 8 },
        { code: '29881', description: 'Knee arthroscopy', count: 6 },
      ],
    };
  }

  async getReviewQueue(
    tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>> {
    return this.listPriorAuths(tenantId, { ...filters, status: 'in-review' });
  }
}
