import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationPort } from './ports/notification.port';
import { SmtpAdapter } from './adapters/smtp.adapter';
import { SendGridAdapter } from './adapters/sendgrid.adapter';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [
    {
      provide: NotificationPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('NOTIFICATION_ADAPTER', 'smtp');
        switch (adapter) {
          case 'smtp':
            return new SmtpAdapter(config);
          case 'sendgrid':
            return new SendGridAdapter(config);
          default:
            throw new Error(`Unknown notification adapter: ${adapter}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [NotificationPort],
})
export class NotificationsModule {}
