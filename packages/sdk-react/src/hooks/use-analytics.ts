import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type {
  UtilizationTrend, UtilizationAnomaly, Benchmark,
  ContractScorecard, VBCContract, ScenarioResult,
} from '@dxp/contracts';

export function useUtilizationDashboard(filters?: { category?: string; period?: string }) {
  return useQuery({
    queryKey: ['utilization', 'dashboard', filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters?.category) qs.set('category', filters.category);
      if (filters?.period) qs.set('period', filters.period);
      return apiFetch<{ trends: UtilizationTrend[]; anomalies: UtilizationAnomaly[]; benchmarks: Benchmark[] }>(
        `/utilization/dashboard?${qs}`,
      );
    },
  });
}

export function useContractScorecards() {
  return useQuery({
    queryKey: ['contracts', 'scorecards'],
    queryFn: () => apiFetch<ContractScorecard[]>('/contracts/scorecards'),
  });
}

export function useVBCDetail(contractId: string) {
  return useQuery({
    queryKey: ['contracts', 'vbc', contractId],
    queryFn: () => apiFetch<VBCContract>(`/contracts/vbc/${contractId}`),
    enabled: !!contractId,
  });
}

export function useScenarioSimulate() {
  return useMutation({
    mutationFn: (assumptions: Record<string, number>) =>
      apiFetch<ScenarioResult>('/contracts/simulate', { method: 'POST', body: JSON.stringify(assumptions) }),
  });
}
