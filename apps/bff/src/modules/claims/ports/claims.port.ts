// Claims Port — the contract that all claims adapters must implement.
// Consumers inject ClaimsPort and never know which adapter is active.

import {
  ClaimSummary,
  ClaimFilters,
  EOBDetail,
  Appeal,
  AppealSubmission,
  ClaimDashboardMetrics,
} from '@dxp/contracts';
import { FhirPaginatedResult } from '@dxp/contracts';

export abstract class ClaimsPort {
  abstract listClaims(
    tenantId: string,
    memberId: string,
    filters: ClaimFilters,
  ): Promise<FhirPaginatedResult<ClaimSummary>>;

  abstract getClaimDetail(tenantId: string, claimId: string): Promise<ClaimSummary>;

  abstract getEOB(tenantId: string, claimId: string): Promise<EOBDetail>;

  abstract submitAppeal(
    tenantId: string,
    claimId: string,
    data: AppealSubmission,
  ): Promise<Appeal>;

  abstract getDashboardMetrics(tenantId: string): Promise<ClaimDashboardMetrics>;
}
