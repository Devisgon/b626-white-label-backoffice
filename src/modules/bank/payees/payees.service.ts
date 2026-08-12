import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreatePayeeDto } from './dto/create-payee.dto';
import { UpdatePayeeDto } from './dto/update-payee.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { requireLocationId } from '../../../common/context/request-context.store';

@Injectable()
export class PayeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async assertAccountBelongsToScope(
    ctx: RequestContext,
    accountId: string,
  ) {
    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: accountId,
        tenantId: ctx.tenantId,
        locationId: requireLocationId(ctx),
      },
    });
    if (!account)
      throw new BadRequestException(
        'defaultAccountId does not belong to this tenant/location',
      );
  }

  async create(ctx: RequestContext, dto: CreatePayeeDto) {
    if (dto.defaultAccountId) {
      await this.assertAccountBelongsToScope(ctx, dto.defaultAccountId);
    }

    const locationId = requireLocationId(ctx);

    const existing = await this.prisma.payee.findFirst({
      where: {
        tenantId: ctx.tenantId,
        locationId,
        payeeName: dto.payeeName,
        status: { not: 'inactive' },
      },
    });

    if (existing) {
      throw new ConflictException(
        'An active payee with this name already exists',
      );
    }

    const data = await this.prisma.payee.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        payeeName: dto.payeeName,
        payeeType: dto.payeeType,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        addressLine1: dto.addressLine1 ?? null,
        addressLine2: dto.addressLine2 ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        postalCode: dto.postalCode ?? null,
        country: dto.country ?? null,
        taxId: dto.taxId ?? null,
        defaultAccountId: dto.defaultAccountId ?? null,
        notes: dto.notes ?? null,
        status: 'active',
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      },
    });

    await this.auditLog.log(ctx, {
      entityType: 'payee',
      entityId: data.id,
      action: 'created',
      afterData: data,
    });

    return data;
  }

  async findAll(
    ctx: RequestContext,
    pagination: PaginationQueryDto,
    status?: string,
    type?: string,
    search?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const where: any = { tenantId: ctx.tenantId, locationId: requireLocationId(ctx) };
    if (status) where.status = status;
    if (type) where.payeeType = type;
    if (search) {
      where.OR = [
        { payeeName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.payee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payee.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(ctx: RequestContext, id: string) {
    const data = await this.prisma.payee.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId: requireLocationId(ctx) },
    });
    if (!data) throw new NotFoundException('Payee not found');
    return data;
  }

  async update(ctx: RequestContext, id: string, dto: UpdatePayeeDto) {
    const before = await this.findOne(ctx, id);

    if (dto.defaultAccountId) {
      await this.assertAccountBelongsToScope(ctx, dto.defaultAccountId);
    }

    const payload: any = { updatedBy: ctx.userId, updatedAt: new Date() };
    if (dto.payeeName !== undefined) payload.payeeName = dto.payeeName;
    if (dto.payeeType !== undefined) payload.payeeType = dto.payeeType;
    if (dto.email !== undefined) payload.email = dto.email;
    if (dto.phone !== undefined) payload.phone = dto.phone;
    if (dto.addressLine1 !== undefined) payload.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) payload.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) payload.city = dto.city;
    if (dto.state !== undefined) payload.state = dto.state;
    if (dto.postalCode !== undefined) payload.postalCode = dto.postalCode;
    if (dto.country !== undefined) payload.country = dto.country;
    if (dto.taxId !== undefined) payload.taxId = dto.taxId;
    if (dto.defaultAccountId !== undefined) payload.defaultAccountId = dto.defaultAccountId;
    if (dto.notes !== undefined) payload.notes = dto.notes;
    if (dto.status !== undefined) payload.status = dto.status;

    const data = await this.prisma.payee.update({
      where: { id },
      data: payload,
    });

    await this.auditLog.log(ctx, {
      entityType: 'payee',
      entityId: id,
      action: 'updated',
      beforeData: before,
      afterData: data,
    });

    return data;
  }

  async remove(ctx: RequestContext, id: string) {
    const before = await this.findOne(ctx, id);

    const data = await this.prisma.payee.update({
      where: { id },
      data: {
        status: 'inactive',
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      },
    });

    await this.auditLog.log(ctx, {
      entityType: 'payee',
      entityId: id,
      action: 'deactivated',
      beforeData: before,
      afterData: data,
    });

    return data;
  }
}