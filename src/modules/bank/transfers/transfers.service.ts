import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { VoidTransferDto } from './dto/void-transfer.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { requireLocationId } from '../../../common/context/request-context.store';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(ctx: RequestContext, dto: CreateTransferDto) {
    let result: { create_transfer: string }[];
    try {
      result = await this.prisma.$queryRaw<{ create_transfer: string }[]>`
        SELECT create_transfer(
          ${ctx.tenantId}, ${ctx.locationId}, ${dto.sourceAccountId}::uuid, ${dto.destinationAccountId}::uuid,
          ${dto.amount}, ${new Date(dto.transferDate)}::date, ${dto.memo ?? null},
          ${dto.transferClearingAccountId}::uuid, ${ctx.userId ?? null}
        ) as create_transfer
      `;
    } catch (error: any) {
      throw new BadRequestException(this.extractPgError(error));
    }

    const newId = result[0].create_transfer;
    const created = await this.findOne(ctx, newId);

    await this.auditLog.log(ctx, {
      entityType: 'fund_transfer',
      entityId: newId,
      action: 'created',
      afterData: created,
    });

    return created;
  }

  async findAll(
    ctx: RequestContext,
    pagination: PaginationQueryDto,
    status?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const where: any = { tenantId: ctx.tenantId, locationId: ctx.locationId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.fundTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fundTransfer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(ctx: RequestContext, id: string) {
    const data = await this.prisma.fundTransfer.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId: requireLocationId(ctx) },
    });
    if (!data) throw new NotFoundException('Transfer not found');
    return data;
  }

  async void(ctx: RequestContext, id: string, dto: VoidTransferDto) {
    try {
      await this.prisma.$executeRaw`
        SELECT void_transfer(${id}::uuid, ${ctx.tenantId}, ${ctx.locationId}, ${dto.voidReason}, ${ctx.userId ?? null})
      `;
    } catch (error: any) {
      throw new BadRequestException(this.extractPgError(error));
    }

    const voided = await this.findOne(ctx, id);

    await this.auditLog.log(ctx, {
      entityType: 'fund_transfer',
      entityId: id,
      action: 'voided',
      afterData: voided,
      notes: dto.voidReason,
    });

    return voided;
  }

  private extractPgError(error: any): string {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      const match = /ERROR:\s*(.+?)(\n|$)/.exec(error.message ?? '');
      if (match) return match[1];
    }
    return error.message ?? 'Database error';
  }
}
