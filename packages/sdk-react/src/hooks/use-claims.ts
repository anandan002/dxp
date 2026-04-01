import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { PaginatedResponse, ClaimSummary, EOBDetail, Appeal, AppealSubmission, ClaimFilters, ClaimDashboardMetrics } from '@dxp/contracts';

export function useClaims(memberId?: string, filters?: ClaimFilters) {
  return useQuery({
    queryKey: ['claims', memberId, filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters?.status) qs.set('status', filters.status);
      if (filters?.type) qs.set('type', filters.type);
      if (filters?.dateFrom) qs.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) qs.set('dateTo', filters.dateTo);
      if (filters?.page) qs.set('page', String(filters.page));
      if (filters?.pageSize) qs.set('pageSize', String(filters.pageSize));
      return apiFetch<PaginatedResponse<ClaimSummary>>(`/claims?${qs}`);
    },
  });
}

export function useClaimDetail(claimId: string) {
  return useQuery({
    queryKey: ['claims', claimId],
    queryFn: () => apiFetch<EOBDetail>(`/claims/${claimId}`),
    enabled: !!claimId,
  });
}

export function useClaimEOB(claimId: string) {
  return useQuery({
    queryKey: ['claims', claimId, 'eob'],
    queryFn: () => apiFetch<EOBDetail>(`/claims/${claimId}/eob`),
    enabled: !!claimId,
  });
}

export function useAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, data }: { claimId: string; data: AppealSubmission }) =>
      apiFetch<Appeal>(`/claims/${claimId}/appeal`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { claimId }) => {
      qc.invalidateQueries({ queryKey: ['claims', claimId] });
      qc.invalidateQueries({ queryKey: ['claims'] });
    },
  });
}

export function useClaimsDashboard() {
  return useQuery({
    queryKey: ['claims', 'dashboard'],
    queryFn: () => apiFetch<ClaimDashboardMetrics>('/claims/dashboard'),
  });
}
