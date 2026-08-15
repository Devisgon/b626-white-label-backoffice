import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import type { RequestContext } from '../../common/interfaces/request-context.interface';
import { CreatePosDeviceDto } from './dto/create-pos-device.dto';
import { UpdatePosDeviceDto } from './dto/update-pos-device.dto';
import { SalesService } from '../sales/sales.service';
import { CreateSaleDto } from '../sales/dto/create-sale.dto';

@Injectable()
export class PosIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
  ) {}

  private requireLocation(ctx: RequestContext): string {
    if (!ctx.locationId) {
      throw new BadRequestException(
        'No active location selected. Call /api/auth/active-location first.',
      );
    }
    return ctx.locationId;
  }

  // ============================================================
  // POS DEVICES
  // ============================================================

  async createDevice(ctx: RequestContext, dto: CreatePosDeviceDto) {
    const locationId = this.requireLocation(ctx);

    const existing = await this.prisma.posDevice.findFirst({
      where: { tenantId: ctx.tenantId, locationId, deviceCode: dto.deviceCode },
    });
    if (existing)
      throw new ConflictException(
        'A POS device with this code already exists at this location',
      );

    return this.prisma.posDevice.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        deviceName: dto.deviceName,
        deviceCode: dto.deviceCode,
        status: 'offline',
        createdBy: ctx.userId,
      },
    });
  }

  async findAllDevices(ctx: RequestContext, status?: string) {
    const locationId = this.requireLocation(ctx);
    return this.prisma.posDevice.findMany({
      where: {
        tenantId: ctx.tenantId,
        locationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneDevice(ctx: RequestContext, id: string) {
    const locationId = this.requireLocation(ctx);
    const device = await this.prisma.posDevice.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId },
    });
    if (!device) throw new NotFoundException('POS device not found');
    return device;
  }

  async updateDevice(ctx: RequestContext, id: string, dto: UpdatePosDeviceDto) {
    await this.findOneDevice(ctx, id);
    return this.prisma.posDevice.update({
      where: { id },
      data: {
        ...(dto.deviceName !== undefined ? { deviceName: dto.deviceName } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        updatedAt: new Date(),
      },
    });
  }

  // ============================================================
  // SYNC QUEUE — tracks what needs to be pushed to the POS device
  // (product/price changes). Actual hardware push is NOT implemented
  // here — this is the queue/log layer only.
  // ============================================================

  async queueSync(
    ctx: RequestContext,
    posDeviceId: string,
    entityType: string,
    entityId: string,
    payload: Record<string, any>,
  ) {
    const locationId = this.requireLocation(ctx);
    await this.findOneDevice(ctx, posDeviceId);

    return this.prisma.posSyncQueueItem.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        posDeviceId,
        entityType,
        entityId,
        payload,
        status: 'pending',
      },
    });
  }

  async getPendingSyncItems(ctx: RequestContext, posDeviceId: string) {
    const locationId = this.requireLocation(ctx);
    await this.findOneDevice(ctx, posDeviceId);

    return this.prisma.posSyncQueueItem.findMany({
      where: {
        tenantId: ctx.tenantId,
        locationId,
        posDeviceId,
        status: 'pending',
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markSynced(
    ctx: RequestContext,
    posDeviceId: string,
    itemIds: string[],
  ) {
    const locationId = this.requireLocation(ctx);
    await this.findOneDevice(ctx, posDeviceId);

    await this.prisma.posSyncQueueItem.updateMany({
      where: {
        id: { in: itemIds },
        tenantId: ctx.tenantId,
        locationId,
        posDeviceId,
      },
      data: { status: 'sent', sentAt: new Date() },
    });

    await this.prisma.posDevice.update({
      where: { id: posDeviceId },
      data: { lastSyncAt: new Date(), status: 'online' },
    });

    return { synced: itemIds.length };
  }

  // ============================================================
  // SALE FROM DEVICE — delegates to the existing SalesService
  // instead of maintaining a duplicate sales table. This confirms
  // the device exists/is valid, then hands off to Sales module,
  // which owns stock deduction, tax, discount, and receipts.
  // ============================================================

  async recordSaleFromDevice(
    ctx: RequestContext,
    posDeviceId: string,
    dto: CreateSaleDto,
  ) {
    await this.findOneDevice(ctx, posDeviceId);
    return this.salesService.create(dto);
  }
}
