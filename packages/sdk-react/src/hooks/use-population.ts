import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { PaginatedResponse, PopulationMetrics, WorklistEntry, RiskBreakdown, CareGap } from '@dxp/contracts';

export function usePopulationDashboard() {
  return useQuery({
    queryKey: ['population', 'dashboard'],
    queryFn: () => apiFetch<PopulationMetrics>('/population/dashboard'),
  });
}

export function useRiskWorklist(params?: { page?: number; tier?: string; sortBy?: string }) {
  return useQuery({
    queryKey: ['population', 'worklist', params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.tier) qs.set('tier', params.tier);
      if (params?.sortBy) qs.set('sortBy', params.sortBy);
      return apiFetch<PaginatedResponse<WorklistEntry>>(`/population/worklist?${qs}`);
    },
  });
}

export function useMemberRiskProfile(memberId: string) {
  return useQuery({
    queryKey: ['population', 'member', memberId, 'risk'],
    queryFn: () => apiFetch<RiskBreakdown>(`/population/member/${memberId}/risk`),
    enabled: !!memberId,
  });
}

export function useCareGaps(filters?: { status?: string; measure?: string; page?: number }) {
  return useQuery({
    queryKey: ['population', 'care-gaps', filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters?.status) qs.set('status', filters.status);
      if (filters?.measure) qs.set('measure', filters.measure);
      if (filters?.page) qs.set('page', String(filters.page));
      return apiFetch<PaginatedResponse<CareGap>>(`/population/care-gaps?${qs}`);
    },
  });
}

export function useCloseCareGap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gapId: string) =>
      apiFetch(`/population/care-gaps/${gapId}/close`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['population', 'care-gaps'] }),
  });
}
