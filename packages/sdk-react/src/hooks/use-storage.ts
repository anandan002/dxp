import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

interface PresignedUrl {
  url: string;
  key: string;
  expiresAt: string;
}

export function usePresignedUpload() {
  return useMutation({
    mutationFn: (data: { key: string; contentType: string }) =>
      apiFetch<PresignedUrl>('/storage/presign/upload', { method: 'POST', body: JSON.stringify(data) }),
  });
}

export function usePresignedDownload() {
  return useMutation({
    mutationFn: (data: { key: string }) =>
      apiFetch<PresignedUrl>('/storage/presign/download', { method: 'POST', body: JSON.stringify(data) }),
  });
}
