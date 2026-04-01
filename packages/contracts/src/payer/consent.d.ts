export type ConsentStatus = 'active' | 'inactive' | 'entered-in-error' | 'rejected';
export type ConsentScope = 'patient-privacy' | 'research' | 'treatment' | 'adr' | 'data-sharing';
export interface ConsentRecord {
    id: string;
    memberId: string;
    status: ConsentStatus;
    scope: ConsentScope;
    description: string;
    grantedDate: string;
    expirationDate?: string;
    grantedTo?: string;
    categories: string[];
}
export interface ConsentDecision {
    scope: ConsentScope;
    granted: boolean;
    categories?: string[];
    grantedTo?: string;
    expirationDate?: string;
}
