import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationPort, SendNotificationDto } from './ports/notification.port';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationPort) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a notification' })
  send(@Body() dto: SendNotificationDto) {
    return this.notifications.send(dto);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send notifications in bulk' })
  sendBulk(@Body() dtos: SendNotificationDto[]) {
    return this.notifications.sendBulk(dtos);
  }
}
