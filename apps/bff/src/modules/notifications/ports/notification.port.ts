export interface SendNotificationDto {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  channel?: 'email' | 'sms';
}

export interface NotificationResult {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  channel: string;
  sentAt: string;
}

export abstract class NotificationPort {
  abstract send(dto: SendNotificationDto): Promise<NotificationResult>;
  abstract sendBulk(dtos: SendNotificationDto[]): Promise<NotificationResult[]>;
}
