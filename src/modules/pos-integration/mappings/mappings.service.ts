import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateMappingDto } from './dto/create-mapping.dto';
import { UpdateMappingDto } from './dto/update-mapping.dto';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class MappingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService,
  ) {}

  private requireLocation(ctx: RequestContext): string {
    if (!ctx.locationId) {
      throw new BadRequestException('No active location selected.');
    }
    return ctx.locationId;
  }

  async create(ctx: RequestContext, dto: CreateMappingDto) {
    const locationId = this.requireLocation(ctx);
    const connection = await this.connectionService.findOne(ctx);

    const existing = await this.prisma.posMapping.findFirst({
      where: {
        posConnectionId: connection.id,
        internalEntityType: dto.internalEntityType,
        internalEntityId: dto.internalEntityId,
      },
    });
    if (existing) {
      throw new ConflictException(
        'A mapping already exists for this internal entity',
      );
    }

    // A mapping is "mapped" once both sides of the pairing are present.
    const status = dto.externalEntityKey ? 'mapped' : 'unresolved';

    const mapping = await this.prisma.posMapping.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        posConnectionId: connection.id,
        internalEntityType: dto.internalEntityType,
        internalEntityId: dto.internalEntityId,
        externalEntityType: dto.externalEntityType,
        externalEntityKey: dto.externalEntityKey,
        externalParentKey: dto.externalParentKey ?? null,
        externalDisplayName: dto.externalDisplayName ?? null,
        status,
        isRequired: dto.isRequired ?? true,
        createdBy: ctx.userId,
      },
    });

    await this.connectionService.logEvent(
      ctx,
      connection.id,
      'mapping_created',
      `Mapping created: ${dto.internalEntityType}:${dto.internalEntityId} -> ${dto.externalEntityKey}`,
    );

    return mapping;
  }

  // "Mapping Overview" stats — Total, Required, Mapped, Unresolved, Partial, Blocked
  async getOverview(ctx: RequestContext) {
    const connection = await this.connectionService.findOne(ctx);

    const [total, required, mapped, unresolved, partial, blocked] =
      await Promise.all([
        this.prisma.posMapping.count({
          where: { posConnectionId: connection.id },
        }),
        this.prisma.posMapping.count({
          where: { posConnectionId: connection.id, isRequired: true },
        }),
        this.prisma.posMapping.count({
          where: { posConnectionId: connection.id, status: 'mapped' },
        }),
        this.prisma.posMapping.count({
          where: { posConnectionId: connection.id, status: 'unresolved' },
        }),
        this.prisma.posMapping.count({
          where: { posConnectionId: connection.id, status: 'partial' },
        }),
        this.prisma.posMapping.count({
          where: { posConnectionId: connection.id, status: 'blocked' },
        }),
      ]);

    return {
      connectionId: connection.id,
      provider: connection.provider,
      siteName: connection.siteName,
      serviceId: connection.serviceId,
      totalMappings: total,
      required,
      mapped,
      unresolved,
      partial,
      blocked,
    };
  }

  async findAll(
    ctx: RequestContext,
    status?: string,
    internalEntityType?: string,
  ) {
    const connection = await this.connectionService.findOne(ctx);

    return this.prisma.posMapping.findMany({
      where: {
        posConnectionId: connection.id,
        ...(status ? { status } : {}),
        ...(internalEntityType ? { internalEntityType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ctx: RequestContext, id: string) {
    const connection = await this.connectionService.findOne(ctx);
    const mapping = await this.prisma.posMapping.findFirst({
      where: { id, posConnectionId: connection.id },
    });
    if (!mapping) throw new NotFoundException('Mapping not found');
    return mapping;
  }

  async update(ctx: RequestContext, id: string, dto: UpdateMappingDto) {
    const existing = await this.findOne(ctx, id);
    const connection = await this.connectionService.findOne(ctx);

    const payload: any = { updatedAt: new Date() };
    if (dto.externalEntityType !== undefined)
      payload.externalEntityType = dto.externalEntityType;
    if (dto.externalEntityKey !== undefined)
      payload.externalEntityKey = dto.externalEntityKey;
    if (dto.externalParentKey !== undefined)
      payload.externalParentKey = dto.externalParentKey;
    if (dto.externalDisplayName !== undefined)
      payload.externalDisplayName = dto.externalDisplayName;
    if (dto.isRequired !== undefined) payload.isRequired = dto.isRequired;
    if (dto.status !== undefined) payload.status = dto.status;

    const updated = await this.prisma.posMapping.update({
      where: { id },
      data: payload,
    });

    await this.connectionService.logEvent(
      ctx,
      connection.id,
      'mapping_updated',
      `Mapping ${id} updated`,
    );

    return updated;
  }

  async remove(ctx: RequestContext, id: string) {
    await this.findOne(ctx, id);
    await this.prisma.posMapping.delete({ where: { id } });
    return { deleted: true };
  }
}
