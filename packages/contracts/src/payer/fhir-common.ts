// Lightweight FHIR R4 type helpers for DXP payer modules
// Full FHIR types available via @types/fhir when needed in adapters

export interface FhirReference {
  reference: string;
  display?: string;
}

export interface FhirCoding {
  system?: string;
  code: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirPeriod {
  start: string;
  end?: string;
}

export interface FhirMoney {
  value: number;
  currency: string;
}

export interface FhirAddress {
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FhirContactPoint {
  system: 'phone' | 'email' | 'fax' | 'url';
  value: string;
  use?: 'home' | 'work' | 'mobile';
}

export interface FhirHumanName {
  given: string[];
  family: string;
  prefix?: string[];
  suffix?: string[];
}

export interface FhirPaginatedResult<T> {
  entry: T[];
  total: number;
  link?: { relation: string; url: string }[];
}
