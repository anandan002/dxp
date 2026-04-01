export interface MemberMatchRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  oldPayerId?: string;
  oldMemberId?: string;
}

export interface ExportJob {
  jobId: string;
  status: 'queued' | 'in-progress' | 'complete' | 'error';
  resourceCount?: number;
  outputUrl?: string;
  requestedAt: string;
  completedAt?: string;
}

export abstract class PayerExchangePort {
  abstract memberMatch(tenantId: string, request: MemberMatchRequest): Promise<{ matchedPatientRef: string; confidence: number }>;
  abstract exportMemberData(tenantId: string, patientRef: string): Promise<ExportJob>;
  abstract getExportStatus(tenantId: string, jobId: string): Promise<ExportJob>;
}
