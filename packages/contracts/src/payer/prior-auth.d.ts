import { FhirCoding, FhirPeriod } from './fhir-common';
export type PAStatus = 'draft' | 'submitted' | 'in-review' | 'approved' | 'denied' | 'pended' | 'cancelled' | 'expired';
export type PAUrgency = 'routine' | 'urgent' | 'emergent';
export interface PriorAuthSummary {
    id: string;
    authNumber: string;
    status: PAStatus;
    urgency: PAUrgency;
    serviceCode: FhirCoding;
    serviceDescription: string;
    requestingProvider: string;
    memberName: string;
    memberId: string;
    submittedDate: string;
    daysInQueue: number;
    decisionDate?: string;
    expirationDate?: string;
    diagnosisDescription?: string;
}
export interface PriorAuthDetail extends PriorAuthSummary {
    clinicalReason: FhirCoding;
    requestedServiceDate: FhirPeriod;
    quantity?: number;
    supportingDocuments: PADocument[];
    reviewNotes?: string;
    decisionRationale?: string;
    timeline: PATimelineEvent[];
}
export interface PADocument {
    id: string;
    name: string;
    type: string;
    uploadedDate: string;
    uploadedBy: string;
}
export interface PATimelineEvent {
    date: string;
    event: string;
    actor?: string;
    notes?: string;
}
export interface CRDResponse {
    requiresAuth: boolean;
    serviceCode: FhirCoding;
    coverageInfo?: string;
    documentationRequired?: string[];
    alternativeSuggestions?: string[];
}
export interface DTRTemplate {
    questionnaireId: string;
    title: string;
    questions: DTRQuestion[];
}
export interface DTRQuestion {
    linkId: string;
    text: string;
    type: 'string' | 'boolean' | 'choice' | 'date' | 'attachment';
    required: boolean;
    options?: {
        code: string;
        display: string;
    }[];
    prefilled?: string;
}
export interface PASubmission {
    memberId: string;
    serviceCode: string;
    urgency: PAUrgency;
    clinicalReasonCode: string;
    requestedServiceDate: FhirPeriod;
    quantity?: number;
    notes?: string;
    documentIds?: string[];
    questionnaireResponseId?: string;
}
export interface PADecision {
    decision: 'approved' | 'denied' | 'pended';
    rationale: string;
    expirationDate?: string;
    conditions?: string;
}
export interface PAQueueFilters {
    status?: PAStatus;
    urgency?: PAUrgency;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}
export interface PADashboardMetrics {
    totalRequests: number;
    pendingReview: number;
    approved: number;
    denied: number;
    automationRate: number;
    avgTurnaroundHoursUrgent: number;
    avgTurnaroundHoursRoutine: number;
    topRequestedServices: {
        code: string;
        description: string;
        count: number;
    }[];
}
