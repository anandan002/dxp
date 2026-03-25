import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationPort, SendNotificationDto, NotificationResult } from '../ports/notification.port';

@Injectable()
export class SmtpAdapter extends NotificationPort {
  private readonly logger = new Logger(SmtpAdapter.name);

  constructor(private config: ConfigService) {
    super();
  }

  async send(dto: SendNotificationDto): Promise<NotificationResult> {
    const host = this.config.get<string>('SMTP_HOST', 'localhost');
    const port = this.config.get<number>('SMTP_PORT', 587);

    this.logger.log(`Sending email via ${host}:${port} to ${dto.to} — subject: ${dto.subject}`);

    // In production: use nodemailer with SMTP transport
    // const transporter = nodemailer.createTransport({ host, port, auth: {...} });
    // await transporter.sendMail({ from, to: dto.to, subject: dto.subject, html: rendered });

    return {
      id: `smtp-${Date.now()}`,
      status: 'sent',
      channel: 'email',
      sentAt: new Date().toISOString(),
    };
  }

  async sendBulk(dtos: SendNotificationDto[]): Promise<NotificationResult[]> {
    return Promise.all(dtos.map((dto) => this.send(dto)));
  }
}
