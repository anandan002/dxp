import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { PaginatedResponse, ProviderSummary, ProviderDetail, ProviderSearchQuery } from '@dxp/contracts';

export function useProviderSearch(query: ProviderSearchQuery) {
  return useQuery({
    queryKey: ['providers', 'search', query],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (query.name) qs.set('name', query.name);
      if (query.specialty) qs.set('specialty', query.specialty);
      if (query.postalCode) qs.set('postalCode', query.postalCode);
      if (query.distance) qs.set('distance', String(query.distance));
      if (query.networkOnly) qs.set('networkOnly', 'true');
      if (query.acceptingNew) qs.set('acceptingNew', 'true');
      if (query.language) qs.set('language', query.language);
      if (query.page) qs.set('page', String(query.page));
      if (query.pageSize) qs.set('pageSize', String(query.pageSize));
      return apiFetch<PaginatedResponse<ProviderSummary>>(`/providers/search?${qs}`);
    },
    enabled: !!(query.name || query.specialty || query.postalCode),
  });
}

export function useProviderDetail(npi: string) {
  return useQuery({
    queryKey: ['providers', npi],
    queryFn: () => apiFetch<ProviderDetail>(`/providers/${npi}`),
    enabled: !!npi,
  });
}
