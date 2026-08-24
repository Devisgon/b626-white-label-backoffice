import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { AuditLogService } from '../../bank/audit/audit-log.service';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private requireLocation(ctx: RequestContext): string {
    if (!ctx.locationId) {
      throw new BadRequestException('No active location selected.');
    }
    return ctx.locationId;
  }

  // Logs a PosEvent for the connection — used across all sub-modules
  // (Connection, Mappings, Outbound, Inbound) to build the "Events" tab.
  async logEvent(
    ctx: RequestContext,
    posConnectionId: string,
    eventType: string,
    description?: string,
  ) {
    await this.prisma.posEvent.create({
      data: {
        tenantId: ctx.tenantId,
        locationId: ctx.locationId!,
        posConnectionId,
        eventType,
        description: description ?? null,
        performedBy: ctx.userId,
      },
    });
  }

  // One connection per tenant+location — this creates it.
  async create(ctx: RequestContext, dto: CreateConnectionDto) {
    const locationId = this.requireLocation(ctx);

    const existing = await this.prisma.posConnection.findFirst({
      where: { tenantId: ctx.tenantId, locationId },
    });
    if (existing) {
      throw new ConflictException(
        'A POS connection already exists for this location. Use PATCH to update it.',
      );
    }

    const connection = await this.prisma.posConnection.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        provider: dto.provider ?? 'verifone_ruby_ci',
        siteName: dto.siteName,
        serviceId: dto.serviceId,
        externalSiteId: dto.externalSiteId,
        connectionMode: dto.connectionMode ?? 'file_xml',
        commanderRelease: dto.commanderRelease ?? null,
        notes: dto.notes ?? null,
        isEnabled: true,
        createdBy: ctx.userId,
      },
    });

    await this.logEvent(
      ctx,
      connection.id,
      'connection_created',
      `Connection profile created for ${connection.siteName}`,
    );

    return connection;
  }

  // "Connection" tab main view — the workspace index summary.
  async getWorkspaceSummary(ctx: RequestContext) {
    const locationId = this.requireLocation(ctx);

    const connection = await this.prisma.posConnection.findFirst({
      where: { tenantId: ctx.tenantId, locationId },
    });
    if (!connection)
      throw new NotFoundException(
        'No POS connection configured for this location',
      );

    const [mappingCount, outboundBatchCount, inboundBatchCount, recentEvents] =
      await Promise.all([
        this.prisma.posMapping.count({
          where: { posConnectionId: connection.id },
        }),
        this.prisma.posOutboundBatch.count({
          where: { posConnectionId: connection.id },
        }),
        this.prisma.posInboundBatch.count({
          where: { posConnectionId: connection.id },
        }),
        this.prisma.posEvent.count({
          where: { posConnectionId: connection.id },
        }),
      ]);

    return {
      connection,
      configuredConnections: 1,
      mappingRows: mappingCount,
      outboundBatches: outboundBatchCount,
      inboundBatches: inboundBatchCount,
      recentEvents,
    };
  }

  async findOne(ctx: RequestContext) {
    const locationId = this.requireLocation(ctx);
    const connection = await this.prisma.posConnection.findFirst({
      where: { tenantId: ctx.tenantId, locationId },
    });
    if (!connection)
      throw new NotFoundException(
        'No POS connection configured for this location',
      );
    return connection;
  }

  async update(ctx: RequestContext, dto: UpdateConnectionDto) {
    const existing = await this.findOne(ctx);

    if (dto.isEnabled === false && !dto.disabledReason) {
      throw new BadRequestException(
        'disabledReason is required when disabling a connection',
      );
    }

    const payload: any = { updatedAt: new Date() };
    if (dto.siteName !== undefined) payload.siteName = dto.siteName;
    if (dto.serviceId !== undefined) payload.serviceId = dto.serviceId;
    if (dto.externalSiteId !== undefined)
      payload.externalSiteId = dto.externalSiteId;
    if (dto.connectionMode !== undefined)
      payload.connectionMode = dto.connectionMode;
    if (dto.commanderRelease !== undefined)
      payload.commanderRelease = dto.commanderRelease;
    if (dto.notes !== undefined) payload.notes = dto.notes;
    if (dto.isEnabled !== undefined) payload.isEnabled = dto.isEnabled;
    if (dto.disabledReason !== undefined)
      payload.disabledReason = dto.disabledReason;

    const updated = await this.prisma.posConnection.update({
      where: { id: existing.id },
      data: payload,
    });

    await this.logEvent(
      ctx,
      existing.id,
      dto.isEnabled === false ? 'connection_disabled' : 'connection_updated',
      dto.isEnabled === false
        ? dto.disabledReason
        : 'Connection profile updated',
    );

    await this.auditLog.log(ctx, {
      entityType: 'pos_connection',
      entityId: existing.id,
      action: 'updated',
      beforeData: existing,
      afterData: updated,
    });

    return updated;
  }
}
