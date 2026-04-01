// CarePlan Port — the contract that all care-plan adapters must implement.
// Consumers inject CarePlanPort and never know which adapter is active.

import {
  CareEvent,
  CareTeamMember,
  HealthProgram,
  DischargePlan,
} from '@dxp/contracts';

export abstract class CarePlanPort {
  abstract getCareTimeline(
    tenantId: string,
    memberId: string,
  ): Promise<CareEvent[]>;

  abstract getCareTeam(
    tenantId: string,
    memberId: string,
  ): Promise<CareTeamMember[]>;

  abstract listPrograms(
    tenantId: string,
    memberId: string,
  ): Promise<HealthProgram[]>;

  abstract getProgramDetail(
    tenantId: string,
    programId: string,
  ): Promise<HealthProgram>;

  abstract getDischargePlan(
    tenantId: string,
    encounterId: string,
  ): Promise<DischargePlan>;
}
