import { FhirAddress, FhirCoding } from './fhir-common';
export type NetworkStatus = 'in-network' | 'out-of-network' | 'pending';
export interface ProviderSummary {
    npi: string;
    name: string;
    specialty: FhirCoding;
    networkStatus: NetworkStatus;
    acceptingNewPatients: boolean;
    address: FhirAddress;
    phone?: string;
    distance?: number;
    rating?: number;
    organizationName?: string;
}
export interface ProviderDetail extends ProviderSummary {
    credentials: string[];
    languages: string[];
    gender?: string;
    boardCertifications: string[];
    hospitalAffiliations: string[];
    locations: ProviderLocation[];
    availability: ProviderAvailability[];
    qualityScores?: ProviderQualityScore[];
}
export interface ProviderLocation {
    id: string;
    name: string;
    address: FhirAddress;
    phone: string;
    fax?: string;
    hours: string;
}
export interface ProviderAvailability {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}
export interface ProviderQualityScore {
    measure: string;
    score: number;
    benchmark: number;
    percentile: number;
}
export interface ProviderSearchQuery {
    name?: string;
    specialty?: string;
    postalCode?: string;
    distance?: number;
    networkOnly?: boolean;
    acceptingNew?: boolean;
    language?: string;
    gender?: string;
    page?: number;
    pageSize?: number;
}
export interface NetworkValidation {
    npi: string;
    networkStatus: NetworkStatus;
    lastVerified: string;
    credentialingStatus: 'active' | 'pending' | 'expired';
    specialties: FhirCoding[];
    locations: string[];
}
export interface ProviderQualityMetrics {
    totalProviders: number;
    inNetworkCount: number;
    acceptingNewCount: number;
    avgRating: number;
    dataAccuracyRate: number;
    anomalyCount: number;
}
