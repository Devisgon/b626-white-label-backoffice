import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { requireLocationId } from '../../../common/context/request-context.store';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(ctx: RequestContext, dto: CreateAccountDto) {
    if (dto.parentAccountId) {
      await this.findOne(ctx, dto.parentAccountId);
    }

    const locationId = requireLocationId(ctx);

    const existing = await this.prisma.chartOfAccount.findFirst({
      where: {
        tenantId: ctx.tenantId,
        locationId,
        accountCode: dto.accountCode,
        status: { not: 'inactive' },
      },
    });

    if (existing) {
      throw new ConflictException(
        'An active account with this code already exists',
      );
    }

    const data = await this.prisma.chartOfAccount.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        accountCode: dto.accountCode,
        accountName: dto.accountName,
        accountCategory: dto.accountCategory,
        normalBalance: dto.normalBalance,
        parentAccountId: dto.parentAccountId ?? null,
        description: dto.description ?? null,
        isSystem: false,
        status: 'active',
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      },
    });

    await this.auditLog.log(ctx, {
      entityType: 'chart_of_account',
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
    category?: string,
    search?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const where: any = { tenantId: ctx.tenantId, locationId: requireLocationId(ctx) };
    if (status) where.status = status;
    if (category) where.accountCategory = category;
    if (search) {
      where.OR = [
        { accountName: { contains: search, mode: 'insensitive' } },
        { accountCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.chartOfAccount.findMany({
        where,
        orderBy: { accountCode: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chartOfAccount.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(ctx: RequestContext, id: string) {
    const data = await this.prisma.chartOfAccount.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId: requireLocationId(ctx) },
    });
    if (!data) throw new NotFoundException('Chart of accounts entry not found');
    return data;
  }

  async update(ctx: RequestContext, id: string, dto: UpdateAccountDto) {
    const before = await this.findOne(ctx, id);

    if (
      before.isSystem &&
      (dto.accountCode || dto.accountCategory || dto.normalBalance)
    ) {
      throw new ForbiddenException(
        'System accounts cannot have their code, category, or normal balance changed',
      );
    }

    if (dto.parentAccountId) {
      if (dto.parentAccountId === id) {
        throw new BadRequestException('An account cannot be its own parent');
      }
      await this.findOne(ctx, dto.parentAccountId);
    }

    const payload: any = { updatedBy: ctx.userId, updatedAt: new Date() };
    if (dto.accountCode !== undefined) payload.accountCode = dto.accountCode;
    if (dto.accountName !== undefined) payload.accountName = dto.accountName;
    if (dto.accountCategory !== undefined)
      payload.accountCategory = dto.accountCategory;
    if (dto.normalBalance !== undefined)
      payload.normalBalance = dto.normalBalance;
    if (dto.parentAccountId !== undefined)
      payload.parentAccountId = dto.parentAccountId;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.status !== undefined) payload.status = dto.status;

    const data = await this.prisma.chartOfAccount.update({
      where: { id },
      data: payload,
    });

    await this.auditLog.log(ctx, {
      entityType: 'chart_of_account',
      entityId: id,
      action: 'updated',
      beforeData: before,
      afterData: data,
    });

    return data;
  }

  async remove(ctx: RequestContext, id: string) {
    const before = await this.findOne(ctx, id);

    if (before.isSystem) {
      throw new ForbiddenException('System accounts cannot be deactivated');
    }

    const data = await this.prisma.chartOfAccount.update({
      where: { id },
      data: {
        status: 'inactive',
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      },
    });

    await this.auditLog.log(ctx, {
      entityType: 'chart_of_account',
      entityId: id,
      action: 'deactivated',
      beforeData: before,
      afterData: data,
    });

    return data;
  }
}