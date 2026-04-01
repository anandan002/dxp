import { FhirMoney } from './fhir-common';

export type ContractType = 'fee-for-service' | 'shared-savings' | 'capitation' | 'bundled-payment' | 'pay-for-performance';

export interface ContractScorecard {
  providerId: string;
  providerName: string;
  contractType: ContractType;
  costPerMember: FhirMoney;
  qualityScore: number;
  utilizationRate: number;
  memberSatisfaction: number;
  overallRating: number;
  attributedMembers: number;
}

export interface VBCContract {
  id: string;
  providerName: string;
  contractType: ContractType;
  effectivePeriod: { start: string; end: string };
  targetMetrics: VBCMetric[];
  sharedSavings?: FhirMoney;
  gainshareRate?: number;
  status: 'active' | 'pending-renewal' | 'expired';
}

export interface VBCMetric {
  name: string;
  target: number;
  actual: number;
  weight: number;
  achieved: boolean;
}

export interface NetworkAnalysis {
  corridor: string;
  fromProvider: string;
  toProvider: string;
  referralCount: number;
  avgCost: FhirMoney;
  qualityScore: number;
  recommendation: 'maintain' | 'redirect' | 'review';
}

export interface ScenarioResult {
  scenarioName: string;
  assumptions: Record<string, number>;
  projectedSavings: FhirMoney;
  projectedQualityImpact: number;
  riskAssessment: 'low' | 'medium' | 'high';
}
