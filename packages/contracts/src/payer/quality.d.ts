export interface HEDISMeasure {
    id: string;
    code: string;
    name: string;
    description: string;
    domain: 'effectiveness' | 'access' | 'experience' | 'utilization';
    numerator: number;
    denominator: number;
    rate: number;
    benchmark: number;
    trend: number;
    starRating?: number;
}
export interface StarsRating {
    overall: number;
    categories: {
        category: string;
        rating: number;
        weight: number;
    }[];
    yearOverYear: {
        year: number;
        rating: number;
    }[];
}
export interface QualityCareGap {
    id: string;
    memberId: string;
    memberName: string;
    measure: string;
    measureCode: string;
    gapType: 'screening' | 'medication' | 'visit' | 'lab' | 'immunization';
    description: string;
    status: 'open' | 'closed' | 'excluded';
    dueDate: string;
    outreachStatus: 'not-started' | 'in-progress' | 'completed' | 'failed';
    lastOutreachChannel?: 'sms' | 'phone' | 'app-push' | 'mail';
}
export interface QualityDashboardMetrics {
    overallStarsRating: number;
    measureCount: number;
    openGapCount: number;
    gapClosureRate: number;
    topGaps: {
        measure: string;
        openCount: number;
    }[];
    submissionReadiness: number;
}
