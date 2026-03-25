import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

interface SendNotificationDto {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export function useSendNotification() {
  return useMutation({
    mutationFn: (dto: SendNotificationDto) =>
      apiFetch('/notifications/send', { method: 'POST', body: JSON.stringify(dto) }),
  });
}
