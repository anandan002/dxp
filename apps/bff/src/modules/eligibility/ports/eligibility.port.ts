// Eligibility Port — the contract that all eligibility adapters must implement.
// Consumers inject EligibilityPort and never know which adapter is active.

import {
  BenefitCategory,
  Accumulator,
  CostEstimate,
  DigitalIdCard,
} from '@dxp/contracts';

export abstract class EligibilityPort {
  abstract getBenefits(tenantId: string, memberId: string): Promise<BenefitCategory[]>;

  abstract getAccumulators(tenantId: string, memberId: string): Promise<Accumulator[]>;

  abstract getCostEstimate(
    tenantId: string,
    memberId: string,
    procedureCode: string,
    providerId?: string,
  ): Promise<CostEstimate>;

  abstract getIdCard(tenantId: string, memberId: string): Promise<DigitalIdCard>;
}
