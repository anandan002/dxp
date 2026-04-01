export interface MemberMatchRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  medicareId?: string;
  medicaidId?: string;
  oldPayerName: string;
  oldPayerCoverageId: string;
}

export interface MemberMatchResult {
  matched: boolean;
  patientRef?: string;
  confidence: 'certain' | 'probable' | 'possible' | 'no-match';
  matchedOn?: string[];
}

export interface DataExportJob {
  jobId: string;
  status: 'accepted' | 'in-progress' | 'completed' | 'error';
  createdAt: string;
  completedAt?: string;
  outputUrl?: string;
  resourceCount?: number;
  error?: string;
}
