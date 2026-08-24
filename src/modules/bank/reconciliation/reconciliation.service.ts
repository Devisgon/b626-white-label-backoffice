import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateReconciliationDto } from './dto/create-reconciliation.dto';
import { MatchLineDto } from './dto/match-line.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { requireLocationId } from '../../../common/context/request-context.store';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(ctx: RequestContext, dto: CreateReconciliationDto) {
    const locationId = requireLocationId(ctx);

    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: dto.bankAccountId,
        tenantId: ctx.tenantId,
        locationId,
      },
    });
    if (!account)
      throw new BadRequestException(
        'bankAccountId does not belong to this tenant/location',
      );

    const data = await this.prisma.bankReconciliation.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        bankAccountId: dto.bankAccountId,
        statementStartDate: new Date(dto.statementStartDate),
        statementEndDate: new Date(dto.statementEndDate),
        statementEndingBalance: dto.statementEndingBalance,
        status: 'in_progress',
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      },
    });

    await this.auditLog.log(ctx, {
      entityType: 'bank_reconciliation',
      entityId: data.id,
      action: 'created',
      afterData: data,
    });

    return data;
  }

  async findAll(
    ctx: RequestContext,
    pagination: PaginationQueryDto,
    bankAccountId?: string,
    status?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const where: any = {
      tenantId: ctx.tenantId,
      locationId: requireLocationId(ctx),
    };
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.bankReconciliation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bankReconciliation.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(ctx: RequestContext, id: string) {
    const data = await this.prisma.bankReconciliation.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId: requireLocationId(ctx) },
    });
    if (!data) throw new NotFoundException('Reconciliation not found');

    const lines = await this.prisma.reconciliationLine.findMany({
      where: { reconciliationId: id },
      include: { transaction: true },
    });

    return { ...data, lines };
  }

  async getUnmatchedTransactions(
    ctx: RequestContext,
    reconciliationId: string,
  ) {
    const reconciliation = await this.findOne(ctx, reconciliationId);

    const matched = await this.prisma.reconciliationLine.findMany({
      where: { reconciliationId },
      select: { transactionId: true },
    });
    const excludeIds = matched.map((m) => m.transactionId);

    return this.prisma.transaction.findMany({
      where: {
        tenantId: ctx.tenantId,
        locationId: requireLocationId(ctx),
        bankAccountId: reconciliation.bankAccountId,
        status: 'posted',
        transactionDate: { lte: reconciliation.statementEndDate },
        id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
      },
      orderBy: { transactionDate: 'asc' },
    });
  }

  async matchLine(
    ctx: RequestContext,
    reconciliationId: string,
    dto: MatchLineDto,
  ) {
    const reconciliation = await this.findOne(ctx, reconciliationId);

    if (reconciliation.status !== 'in_progress') {
      throw new BadRequestException(
        'Cannot match lines on a reconciliation that is not in_progress',
      );
    }

    const txn = await this.prisma.transaction.findFirst({
      where: {
        id: dto.transactionId,
        tenantId: ctx.tenantId,
        locationId: requireLocationId(ctx),
      },
    });

    if (!txn)
      throw new BadRequestException(
        'transactionId does not belong to this tenant/location',
      );
    if (txn.bankAccountId !== reconciliation.bankAccountId) {
      throw new BadRequestException(
        'Transaction does not belong to the bank account being reconciled',
      );
    }
    if (txn.status !== 'posted') {
      throw new BadRequestException(
        'Only posted transactions can be reconciled',
      );
    }

    return this.prisma.reconciliationLine.create({
      data: {
        reconciliationId,
        transactionId: dto.transactionId,
        cleared: dto.cleared ?? true,
        statementReference: dto.statementReference ?? null,
      },
    });
  }

  async unmatchLine(
    ctx: RequestContext,
    reconciliationId: string,
    transactionId: string,
  ) {
    const reconciliation = await this.findOne(ctx, reconciliationId);

    if (reconciliation.status !== 'in_progress') {
      throw new BadRequestException(
        'Cannot unmatch lines on a reconciliation that is not in_progress',
      );
    }

    await this.prisma.reconciliationLine.deleteMany({
      where: { reconciliationId, transactionId },
    });

    return { unmatched: true };
  }

  async complete(ctx: RequestContext, id: string) {
    try {
      await this.prisma.$executeRaw`
        SELECT complete_reconciliation(${id}::uuid, ${ctx.tenantId}, ${ctx.locationId}, ${ctx.userId ?? null})
      `;
    } catch (error: any) {
      throw new BadRequestException(this.extractPgError(error));
    }

    const completed = await this.findOne(ctx, id);

    await this.auditLog.log(ctx, {
      entityType: 'bank_reconciliation',
      entityId: id,
      action: 'completed',
      afterData: completed,
    });

    return completed;
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
