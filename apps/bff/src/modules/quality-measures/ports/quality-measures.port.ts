// QualityMeasures Port — the contract that all quality adapters must implement.
// Consumers inject QualityMeasuresPort and never know which adapter is active.

import {
  HEDISMeasure,
  QualityCareGap,
  QualityDashboardMetrics,
} from '@dxp/contracts';

export interface QualityFilters {
  domain?: string;
  measureCode?: string;
}

export interface QualityCareGapFilters {
  status?: string;
  measure?: string;
  memberId?: string;
  gapType?: string;
}

export interface SubmissionStatus {
  measureCode: string;
  measureName: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  submissionDate?: string;
  dueDate: string;
}

export abstract class QualityMeasuresPort {
  abstract getMeasures(
    tenantId: string,
    filters: QualityFilters,
  ): Promise<HEDISMeasure[]>;

  abstract getCareGaps(
    tenantId: string,
    filters: QualityCareGapFilters,
  ): Promise<QualityCareGap[]>;

  abstract triggerOutreach(
    tenantId: string,
    gapId: string,
    channel: 'sms' | 'phone' | 'app-push' | 'mail',
  ): Promise<QualityCareGap>;

  abstract getSubmissionStatus(
    tenantId: string,
  ): Promise<SubmissionStatus[]>;
}
