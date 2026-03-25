import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

export function useSearch(table: string, term: string, options?: { page?: number; pageSize?: number; enabled?: boolean }) {
  const qs = new URLSearchParams({ table, q: term });
  if (options?.page) qs.set('page', String(options.page));
  if (options?.pageSize) qs.set('pageSize', String(options.pageSize));

  return useQuery({
    queryKey: ['search', table, term, options?.page],
    queryFn: () => apiFetch(`/search?${qs}`),
    enabled: options?.enabled !== false && term.length > 0,
  });
}

export function useSuggest(table: string, term: string) {
  return useQuery({
    queryKey: ['suggest', table, term],
    queryFn: () => apiFetch<string[]>(`/search/suggest?table=${table}&q=${term}`),
    enabled: term.length >= 2,
  });
}
