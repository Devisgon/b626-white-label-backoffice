import { Body, Controller, Get, Param, ParseEnumPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationChannel, NotificationEvent } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

// Personal preferences — every user (any role) manages their own, so no
// @RequiresModule/@Roles gate here, same reasoning as Timesheets' "mine"
// routes.
@ApiTags('Settings — Notifications')
@ApiBearerAuth('accessToken')
@Controller('api/settings/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Your notification preferences (which events notify you, on which channel)' })
  mine(@CurrentUser('id') userId: string) {
    return this.notifications.myPreferences(userId);
  }

  @Patch('mine/:event/:channel')
  @ApiOperation({ summary: 'Turn one notification on/off for yourself' })
  setPreference(
    @CurrentUser('id') userId: string,
    @Param('event', new ParseEnumPipe(NotificationEvent)) event: NotificationEvent,
    @Param('channel', new ParseEnumPipe(NotificationChannel)) channel: NotificationChannel,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.notifications.setPreference(userId, event, channel, dto.isEnabled);
  }
}