import { FhirCoding, FhirMoney } from './fhir-common';
export type ClaimStatus = 'submitted' | 'in-review' | 'adjudicated' | 'paid' | 'denied' | 'appealed';
export type ClaimType = 'professional' | 'institutional' | 'pharmacy';
export interface ClaimSummary {
    id: string;
    claimNumber: string;
    type: ClaimType;
    status: ClaimStatus;
    serviceDate: string;
    provider: string;
    billedAmount: FhirMoney;
    allowedAmount: FhirMoney;
    paidAmount: FhirMoney;
    memberOwes: FhirMoney;
    primaryDiagnosis?: string;
}
export interface ServiceLine {
    sequence: number;
    procedureCode: FhirCoding;
    serviceDate: string;
    billedAmount: FhirMoney;
    allowedAmount: FhirMoney;
    paidAmount: FhirMoney;
    memberOwes: FhirMoney;
    adjudicationNotes?: string;
}
export interface EOBDetail {
    id: string;
    claim: ClaimSummary;
    serviceLines: ServiceLine[];
    denialReasons?: DenialReason[];
    paymentDate?: string;
    checkNumber?: string;
}
export interface DenialReason {
    code: string;
    display: string;
    explanation: string;
}
export interface AppealSubmission {
    claimId: string;
    reason: string;
    narrative: string;
    supportingDocumentIds?: string[];
}
export interface Appeal {
    id: string;
    claimId: string;
    status: 'submitted' | 'in-review' | 'upheld' | 'overturned';
    submittedDate: string;
    reason: string;
    decisionDate?: string;
    decisionNotes?: string;
}
export interface ClaimFilters {
    status?: ClaimStatus;
    type?: ClaimType;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}
export interface ClaimDashboardMetrics {
    totalClaims: number;
    pendingClaims: number;
    deniedClaims: number;
    denialRate: number;
    avgTurnaroundDays: number;
    autoAdjudicationRate: number;
    totalBilled: FhirMoney;
    totalPaid: FhirMoney;
}
