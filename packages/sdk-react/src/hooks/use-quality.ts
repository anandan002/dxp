import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { PaginatedResponse, QualityDashboardMetrics, QualityCareGap } from '@dxp/contracts';

export function useQualityDashboard() {
  return useQuery({
    queryKey: ['quality', 'dashboard'],
    queryFn: () => apiFetch<QualityDashboardMetrics>('/quality/dashboard'),
  });
}

export function useQualityCareGaps(filters?: { measure?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['quality', 'care-gaps', filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters?.measure) qs.set('measure', filters.measure);
      if (filters?.status) qs.set('status', filters.status);
      if (filters?.page) qs.set('page', String(filters.page));
      return apiFetch<PaginatedResponse<QualityCareGap>>(`/quality/care-gaps?${qs}`);
    },
  });
}

export function useTriggerOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gapId, channel }: { gapId: string; channel: string }) =>
      apiFetch(`/quality/outreach/${gapId}`, { method: 'POST', body: JSON.stringify({ channel }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quality', 'care-gaps'] }),
  });
}
