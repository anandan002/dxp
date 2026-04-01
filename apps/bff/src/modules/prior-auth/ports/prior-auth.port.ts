// Prior Auth Port — the contract that all prior-auth adapters must implement.
// Consumers inject PriorAuthPort and never know which adapter is active.

import {
  PriorAuthSummary,
  PriorAuthDetail,
  PAQueueFilters,
  CRDResponse,
  DTRTemplate,
  PASubmission,
  PADecision,
  PADashboardMetrics,
} from '@dxp/contracts';
import { FhirPaginatedResult } from '@dxp/contracts';

export abstract class PriorAuthPort {
  abstract listPriorAuths(
    tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>>;

  abstract getPriorAuthDetail(tenantId: string, id: string): Promise<PriorAuthDetail>;

  abstract checkRequirement(
    tenantId: string,
    serviceCode: string,
    memberId: string,
  ): Promise<CRDResponse>;

  abstract getDocTemplate(tenantId: string, code: string): Promise<DTRTemplate>;

  abstract submitRequest(tenantId: string, data: PASubmission): Promise<PriorAuthSummary>;

  abstract decide(tenantId: string, id: string, decision: PADecision): Promise<PriorAuthDetail>;

  abstract getDashboardMetrics(tenantId: string): Promise<PADashboardMetrics>;

  abstract getReviewQueue(
    tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>>;
}
