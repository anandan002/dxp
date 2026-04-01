import { FhirCoding } from './fhir-common';
export type RiskTier = 'low' | 'moderate' | 'high' | 'critical';
export interface RiskScore {
    memberId: string;
    memberName: string;
    overallScore: number;
    tier: RiskTier;
    hccCount: number;
    openGaps: number;
    lastUpdated: string;
}
export interface RiskBreakdown {
    memberId: string;
    claimsScore: number;
    clinicalScore: number;
    sdohScore: number;
    overallScore: number;
    conditions: {
        code: FhirCoding;
        hccCategory?: string;
        documented: boolean;
    }[];
    sdohFactors: {
        factor: string;
        risk: 'low' | 'medium' | 'high';
    }[];
}
export interface CareGap {
    id: string;
    memberId: string;
    memberName: string;
    measure: string;
    measureCode: string;
    description: string;
    status: 'open' | 'closed' | 'excluded';
    dueDate?: string;
    closedDate?: string;
    outreachAttempts: number;
    lastOutreachDate?: string;
}
export interface WorklistEntry extends RiskScore {
    primaryCondition: string;
    lastEncounterDate?: string;
    careManagerAssigned?: string;
    urgentGaps: string[];
}
export interface PopulationMetrics {
    totalMembers: number;
    byRiskTier: {
        tier: RiskTier;
        count: number;
        percentage: number;
    }[];
    avgRiskScore: number;
    totalOpenGaps: number;
    gapClosureRate: number;
    readmissionRate: number;
    edUtilizationRate: number;
}
