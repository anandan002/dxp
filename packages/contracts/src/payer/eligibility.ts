import { FhirCoding, FhirMoney, FhirPeriod } from './fhir-common';

export type PlanType = 'HMO' | 'PPO' | 'EPO' | 'HDHP' | 'MA' | 'POS';

export interface Coverage {
  id: string;
  memberId: string;
  groupNumber: string;
  planName: string;
  planType: PlanType;
  status: 'active' | 'cancelled' | 'entered-in-error';
  period: FhirPeriod;
  subscriberName: string;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  payerName: string;
}

export interface BenefitCategory {
  category: string;
  network: 'in-network' | 'out-of-network';
  copay?: FhirMoney;
  coinsurancePercent?: number;
  priorAuthRequired: boolean;
  coverageNotes?: string;
}

export interface Accumulator {
  type: 'deductible' | 'out-of-pocket-max' | 'copay-max';
  network: 'in-network' | 'out-of-network';
  limit: FhirMoney;
  used: FhirMoney;
  remaining: FhirMoney;
  period: FhirPeriod;
}

export interface CostEstimate {
  procedureCode: FhirCoding;
  procedureDescription: string;
  providerName?: string;
  estimatedTotal: FhirMoney;
  planPays: FhirMoney;
  memberPays: FhirMoney;
  copay: FhirMoney;
  coinsurance: FhirMoney;
  deductibleApplied: FhirMoney;
  disclaimer: string;
}

export interface DigitalIdCard {
  memberId: string;
  memberName: string;
  groupNumber: string;
  planName: string;
  planType: PlanType;
  rxBin: string;
  rxPcn: string;
  rxGroup: string;
  payerName: string;
  payerPhone: string;
  effectiveDate: string;
  dependents?: string[];
}
