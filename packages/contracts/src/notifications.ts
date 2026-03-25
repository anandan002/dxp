export interface Notification {
  id: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  templateId: string;
  recipientId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  payload: Record<string, unknown>;
  sentAt?: string;
  readAt?: string;
}

export interface SendNotificationDto {
  templateId: string;
  recipientId: string;
  channels?: ('email' | 'sms' | 'push' | 'in_app')[];
  payload: Record<string, unknown>;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}
