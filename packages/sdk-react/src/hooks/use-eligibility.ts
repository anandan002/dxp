import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { BenefitCategory, Accumulator, CostEstimate, DigitalIdCard } from '@dxp/contracts';

export function useBenefits() {
  return useQuery({
    queryKey: ['eligibility', 'benefits'],
    queryFn: () => apiFetch<BenefitCategory[]>('/eligibility/benefits'),
  });
}

export function useAccumulators() {
  return useQuery({
    queryKey: ['eligibility', 'accumulators'],
    queryFn: () => apiFetch<Accumulator[]>('/eligibility/accumulators'),
  });
}

export function useCostEstimate(procedureCode: string, providerId?: string) {
  const qs = new URLSearchParams({ procedureCode });
  if (providerId) qs.set('providerId', providerId);
  return useQuery({
    queryKey: ['eligibility', 'cost-estimate', procedureCode, providerId],
    queryFn: () => apiFetch<CostEstimate>(`/eligibility/cost-estimate?${qs}`),
    enabled: !!procedureCode,
  });
}

export function useIdCard() {
  return useQuery({
    queryKey: ['eligibility', 'id-card'],
    queryFn: () => apiFetch<DigitalIdCard>('/eligibility/id-card'),
  });
}
