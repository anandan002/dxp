export type ServiceCategory = 'inpatient' | 'outpatient' | 'ed' | 'specialty' | 'pharmacy' | 'behavioral-health' | 'imaging';

export interface UtilizationTrend {
  category: ServiceCategory;
  period: string;
  admissions: number;
  visits: number;
  totalCost: number;
  perMemberPerMonth: number;
  changeFromPrior: number;
}

export interface UtilizationAnomaly {
  id: string;
  category: ServiceCategory;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedDate: string;
  baselineValue: number;
  actualValue: number;
  deviationPercent: number;
  affectedMemberCount: number;
}

export interface Benchmark {
  category: ServiceCategory;
  metric: string;
  planValue: number;
  ncqaBenchmark: number;
  cmsBenchmark: number;
  percentile: number;
}
