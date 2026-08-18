import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateBatchDto } from './dto/create-batch.dto';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class OutboundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService,
  ) {}

  // "Outbound Integration Boundary" readiness check — a batch can only
  // be created from mappings that are status='mapped' (i.e. approved/
  // published internally). Anything unresolved/partial/blocked is
  // excluded, matching "approved internal POS-published artifacts only".
  async getReadiness(ctx: RequestContext) {
    const connection = await this.connectionService.findOne(ctx);

    const eligible = await this.prisma.posMapping.count({
      where: { posConnectionId: connection.id, status: 'mapped' },
    });
    const blocked = await this.prisma.posMapping.count({
      where: {
        posConnectionId: connection.id,
        status: { in: ['unresolved', 'partial', 'blocked'] },
      },
    });
    const requiredBlockers = await this.prisma.posMapping.count({
      where: {
        posConnectionId: connection.id,
        isRequired: true,
        status: { not: 'mapped' },
      },
    });

    const lastBatch = await this.prisma.posOutboundBatch.findFirst({
      where: { posConnectionId: connection.id },
      orderBy: { createdAt: 'desc' },
    });

    const readiness = eligible > 0 ? 'ready' : 'blocked';

    // Breakdown by internal entity type — mirrors "Source Group Readiness"
    const grouped = await this.prisma.posMapping.groupBy({
      by: ['internalEntityType', 'status'],
      where: { posConnectionId: connection.id },
      _count: true,
    });

    const groupMap = new Map<
      string,
      { candidates: number; eligible: number; blocked: number }
    >();
    for (const row of grouped) {
      const key = row.internalEntityType;
      if (!groupMap.has(key))
        groupMap.set(key, { candidates: 0, eligible: 0, blocked: 0 });
      const g = groupMap.get(key)!;
      g.candidates += row._count;
      if (row.status === 'mapped') g.eligible += row._count;
      else g.blocked += row._count;
    }

    const sourceGroups = Array.from(groupMap.entries()).map(
      ([group, stats]) => ({
        group,
        ...stats,
      }),
    );

    return {
      connectionId: connection.id,
      outboundReadiness: readiness,
      eligibleSourceRows: eligible,
      blockedSourceRows: blocked,
      requiredMappingBlockers: requiredBlockers,
      connectionMode: connection.connectionMode,
      commanderRelease: connection.commanderRelease,
      lastOutboundSync: lastBatch?.sentAt ?? null,
      sourceGroups,
    };
  }

  // "Create Batch" action — bundles all (or specified) eligible mappings
  // into a new pending outbound batch with one item per mapping.
  async createBatch(ctx: RequestContext, dto: CreateBatchDto) {
    const locationId = ctx.locationId;
    if (!locationId)
      throw new BadRequestException('No active location selected.');

    const connection = await this.connectionService.findOne(ctx);

    const mappings = await this.prisma.posMapping.findMany({
      where: {
        posConnectionId: connection.id,
        status: 'mapped',
        ...(dto.mappingIds && dto.mappingIds.length > 0
          ? { id: { in: dto.mappingIds } }
          : {}),
      },
    });

    if (mappings.length === 0) {
      throw new BadRequestException(
        'No approved published artifacts are currently eligible for outbound batch creation.',
      );
    }

    const batch = await this.prisma.$transaction(async (tx) => {
      const createdBatch = await tx.posOutboundBatch.create({
        data: {
          tenantId: ctx.tenantId,
          locationId,
          posConnectionId: connection.id,
          status: 'pending',
          itemCount: mappings.length,
          createdBy: ctx.userId,
        },
      });

      await tx.posOutboundBatchItem.createMany({
        data: mappings.map((m) => ({
          batchId: createdBatch.id,
          mappingId: m.id,
          payload: {
            internalEntityType: m.internalEntityType,
            internalEntityId: m.internalEntityId,
            externalEntityKey: m.externalEntityKey,
            externalDisplayName: m.externalDisplayName,
          },
        })),
      });

      return createdBatch;
    });

    await this.connectionService.logEvent(
      ctx,
      connection.id,
      'batch_created',
      `Outbound batch created with ${mappings.length} item(s)`,
    );

    return this.getBatch(ctx, batch.id);
  }

  // Marks a pending batch as sent — no real Verifone transport is
  // implemented in this phase (matches the screenshot's own note:
  // "No live Verifone transport is being claimed in this phase").
  async sendBatch(ctx: RequestContext, id: string) {
    const batch = await this.getBatch(ctx, id);

    if (batch.status !== 'pending') {
      throw new BadRequestException(
        `Only pending batches can be sent (current status: ${batch.status})`,
      );
    }

    const updated = await this.prisma.posOutboundBatch.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });

    await this.connectionService.logEvent(
      ctx,
      batch.posConnectionId,
      'batch_sent',
      `Outbound batch ${id} marked sent`,
    );

    return updated;
  }

  async findAll(ctx: RequestContext, status?: string) {
    const connection = await this.connectionService.findOne(ctx);

    return this.prisma.posOutboundBatch.findMany({
      where: { posConnectionId: connection.id, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatch(ctx: RequestContext, id: string) {
    const connection = await this.connectionService.findOne(ctx);
    const batch = await this.prisma.posOutboundBatch.findFirst({
      where: { id, posConnectionId: connection.id },
      include: { items: true },
    });
    if (!batch) throw new NotFoundException('Outbound batch not found');
    return batch;
  }
}
