import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type {
  PaginatedResponse, PriorAuthSummary, PriorAuthDetail,
  CRDResponse, DTRTemplate, PASubmission, PADecision,
  PAQueueFilters, PADashboardMetrics,
} from '@dxp/contracts';

export function usePriorAuths(filters?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['prior-auth', filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters?.status) qs.set('status', filters.status);
      if (filters?.page) qs.set('page', String(filters.page));
      return apiFetch<PaginatedResponse<PriorAuthSummary>>(`/prior-auth?${qs}`);
    },
  });
}

export function usePriorAuthDetail(paId: string) {
  return useQuery({
    queryKey: ['prior-auth', paId],
    queryFn: () => apiFetch<PriorAuthDetail>(`/prior-auth/${paId}`),
    enabled: !!paId,
  });
}

export function usePACheck() {
  return useMutation({
    mutationFn: (data: { serviceCode: string; memberId: string }) =>
      apiFetch<CRDResponse>('/prior-auth/check', { method: 'POST', body: JSON.stringify(data) }),
  });
}

export function usePATemplate(serviceCode: string) {
  return useQuery({
    queryKey: ['prior-auth', 'template', serviceCode],
    queryFn: () => apiFetch<DTRTemplate>(`/prior-auth/template/${serviceCode}`),
    enabled: !!serviceCode,
  });
}

export function usePASubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PASubmission) =>
      apiFetch<PriorAuthSummary>('/prior-auth/submit', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prior-auth'] }),
  });
}

export function usePADecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paId, decision }: { paId: string; decision: PADecision }) =>
      apiFetch(`/prior-auth/${paId}/decide`, { method: 'PUT', body: JSON.stringify(decision) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prior-auth'] }),
  });
}

export function usePAQueue(filters?: PAQueueFilters) {
  return useQuery({
    queryKey: ['prior-auth', 'queue', filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters?.status) qs.set('status', filters.status);
      if (filters?.urgency) qs.set('urgency', filters.urgency);
      if (filters?.page) qs.set('page', String(filters.page));
      return apiFetch<PaginatedResponse<PriorAuthSummary>>(`/prior-auth/queue?${qs}`);
    },
  });
}

export function usePADashboard() {
  return useQuery({
    queryKey: ['prior-auth', 'dashboard'],
    queryFn: () => apiFetch<PADashboardMetrics>('/prior-auth/dashboard'),
  });
}
