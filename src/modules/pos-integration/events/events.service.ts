import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService,
  ) {}

  async findAll(
    ctx: RequestContext,
    eventType?: string,
    limit = 50,
    offset = 0,
  ) {
    const connection = await this.connectionService.findOne(ctx);

    const [events, total] = await Promise.all([
      this.prisma.posEvent.findMany({
        where: {
          posConnectionId: connection.id,
          ...(eventType ? { eventType } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200), // hard cap — log table, bade takes se bachna hai
        skip: offset,
      }),
      this.prisma.posEvent.count({
        where: {
          posConnectionId: connection.id,
          ...(eventType ? { eventType } : {}),
        },
      }),
    ]);

    return {
      data: events,
      total,
      limit,
      offset,
    };
  }

  // Events tab ke top pe ek quick breakdown — kis type ke kitne events hain
  async getSummary(ctx: RequestContext) {
    const connection = await this.connectionService.findOne(ctx);

    const grouped = await this.prisma.posEvent.groupBy({
      by: ['eventType'],
      where: { posConnectionId: connection.id },
      _count: { eventType: true },
    });

    const totalEvents = grouped.reduce((sum, g) => sum + g._count.eventType, 0);

    return {
      totalEvents,
      byType: grouped.map((g) => ({
        eventType: g.eventType,
        count: g._count.eventType,
      })),
    };
  }
}
