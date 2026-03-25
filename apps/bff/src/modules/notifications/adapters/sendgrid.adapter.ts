import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationPort, SendNotificationDto, NotificationResult } from '../ports/notification.port';

@Injectable()
export class SendGridAdapter extends NotificationPort {
  private readonly logger = new Logger(SendGridAdapter.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    super();
    this.apiKey = this.config.get<string>('SENDGRID_API_KEY', '');
    this.fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL', 'portal@example.com');
  }

  async send(dto: SendNotificationDto): Promise<NotificationResult> {
    this.logger.log(`Sending via SendGrid to ${dto.to} — subject: ${dto.subject}`);

    if (!this.apiKey) {
      this.logger.warn('SENDGRID_API_KEY not configured, skipping send');
      return { id: `sg-${Date.now()}`, status: 'failed', channel: 'email', sentAt: new Date().toISOString() };
    }

    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email: dto.to }] }],
        from: { email: this.fromEmail },
        subject: dto.subject,
        content: [{ type: 'text/html', value: `Template: ${dto.template}, Data: ${JSON.stringify(dto.data)}` }],
      },
      { headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } },
    );

    return {
      id: `sg-${Date.now()}`,
      status: 'sent',
      channel: 'email',
      sentAt: new Date().toISOString(),
    };
  }

  async sendBulk(dtos: SendNotificationDto[]): Promise<NotificationResult[]> {
    return Promise.all(dtos.map((dto) => this.send(dto)));
  }
}
