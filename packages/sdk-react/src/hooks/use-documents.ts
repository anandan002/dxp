import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

interface DocumentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export function useDocuments(category?: string) {
  const qs = category ? `?category=${category}` : '';
  return useQuery({
    queryKey: ['documents', category],
    queryFn: () => apiFetch<{ data: DocumentMeta[]; total: number }>(`/documents${qs}`),
  });
}

export function useDocumentUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; category: string; mimeType: string; data: string }) =>
      apiFetch<DocumentMeta>('/documents', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDocumentDownloadUrl(id: string) {
  return useQuery({
    queryKey: ['documents', id, 'download'],
    queryFn: () => apiFetch<string>(`/documents/${id}/download-url`),
    enabled: !!id,
  });
}
