import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

export function useCms(type: string, params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['cms', type, params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.search) qs.set('search', params.search);
      return apiFetch(`/cms/${type}?${qs}`);
    },
  });
}

export function useCmsItem(type: string, id: string) {
  return useQuery({
    queryKey: ['cms', type, id],
    queryFn: () => apiFetch(`/cms/${type}/${id}`),
    enabled: !!id,
  });
}

export function useCmsCreate(type: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/cms/${type}`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms', type] }),
  });
}
