// RiskStratification Port — the contract that all risk-strat adapters must implement.
// Consumers inject RiskStratificationPort and never know which adapter is active.

import {
  PopulationMetrics,
  WorklistEntry,
  RiskBreakdown,
  CareGap,
} from '@dxp/contracts';

export interface WorklistParams {
  tier?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface CareGapFilters {
  status?: string;
  measure?: string;
  memberId?: string;
}

export abstract class RiskStratificationPort {
  abstract getPopulationDashboard(
    tenantId: string,
  ): Promise<PopulationMetrics>;

  abstract getRiskWorklist(
    tenantId: string,
    params: WorklistParams,
  ): Promise<WorklistEntry[]>;

  abstract getMemberRiskProfile(
    tenantId: string,
    memberId: string,
  ): Promise<RiskBreakdown>;

  abstract getCareGaps(
    tenantId: string,
    filters: CareGapFilters,
  ): Promise<CareGap[]>;

  abstract closeCareGap(
    tenantId: string,
    gapId: string,
  ): Promise<CareGap>;
}
