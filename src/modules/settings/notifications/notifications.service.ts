import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Auto-provisions every (event x channel) combination for this user the
  // first time they're queried — enabled by default — same pattern as
  // PaymentMethodsService. Personal preferences, so no tenant/admin gate:
  // every user manages their own.
  async myPreferences(userId: string) {
    const events = Object.values(NotificationEvent);
    const channels = Object.values(NotificationChannel);

    await this.prisma.$transaction(
      events.flatMap((event) =>
        channels.map((channel) =>
          this.prisma.notificationPreference.upsert({
            where: { userId_event_channel: { userId, event, channel } },
            create: { userId, event, channel, isEnabled: true },
            update: {},
          }),
        ),
      ),
    );

    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ event: 'asc' }, { channel: 'asc' }],
    });
  }

  async setPreference(
    userId: string,
    event: NotificationEvent,
    channel: NotificationChannel,
    isEnabled: boolean,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId_event_channel: { userId, event, channel } },
      create: { userId, event, channel, isEnabled },
      update: { isEnabled },
    });
  }
}