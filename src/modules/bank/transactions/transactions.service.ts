import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { requireLocationId } from '../../../common/context/request-context.store';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(ctx: RequestContext, dto: CreateTransactionDto) {
    const lines = dto.lines.map((l) => ({
      account_id: l.accountId,
      line_type: l.lineType,
      amount: l.amount,
      description: l.description ?? null,
    }));

    let result: { create_transaction_with_lines: string }[];
    try {
      result = await this.prisma.$queryRaw<
        { create_transaction_with_lines: string }[]
      >`
        SELECT create_transaction_with_lines(
          ${ctx.tenantId}, ${ctx.locationId}, ${dto.transactionType}, ${dto.direction},
          ${new Date(dto.transactionDate)}::date, ${dto.bankAccountId}::uuid,
          ${dto.payeeId ?? null}::uuid, ${dto.referenceNumber ?? null},
          ${dto.memo ?? null}, ${dto.amount}, ${ctx.userId ?? null},
          ${JSON.stringify(lines)}::jsonb
        ) as create_transaction_with_lines
      `;
    } catch (error: any) {
      throw new BadRequestException(this.extractPgError(error));
    }

    const newId = result[0].create_transaction_with_lines;
    const created = await this.findOne(ctx, newId);

    await this.auditLog.log(ctx, {
      entityType: 'transaction',
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
    bankAccountId?: string,
    direction?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const where: any = { tenantId: ctx.tenantId, locationId: ctx.locationId };
    if (status) where.status = status;
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (direction) where.direction = direction;
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
      if (dateTo) where.transactionDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(ctx: RequestContext, id: string) {
    const data = await this.prisma.transaction.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId: requireLocationId(ctx) },
    });
    if (!data) throw new NotFoundException('Transaction not found');

    const lines = await this.prisma.transactionLine.findMany({
      where: { transactionId: id },
      orderBy: { lineOrder: 'asc' },
    });

    return { ...data, lines };
  }

  async post(ctx: RequestContext, id: string) {
    try {
      await this.prisma.$executeRaw`
        SELECT post_transaction(${id}::uuid, ${ctx.tenantId}, ${ctx.locationId}, ${ctx.userId ?? null})
      `;
    } catch (error: any) {
      throw new BadRequestException(this.extractPgError(error));
    }

    const posted = await this.findOne(ctx, id);

    await this.auditLog.log(ctx, {
      entityType: 'transaction',
      entityId: id,
      action: 'posted',
      afterData: posted,
    });

    return posted;
  }

  async void(ctx: RequestContext, id: string, dto: VoidTransactionDto) {
    let result: { void_transaction: string | null }[];
    try {
      result = await this.prisma.$queryRaw<
        { void_transaction: string | null }[]
      >`
        SELECT void_transaction(${id}::uuid, ${ctx.tenantId}, ${ctx.locationId}, ${dto.voidReason}, ${ctx.userId ?? null}) as void_transaction
      `;
    } catch (error: any) {
      throw new BadRequestException(this.extractPgError(error));
    }

    const reversalId = result[0].void_transaction;
    const voided = await this.findOne(ctx, id);
    const reversal = reversalId ? await this.findOne(ctx, reversalId) : null;

    await this.auditLog.log(ctx, {
      entityType: 'transaction',
      entityId: id,
      action: 'voided',
      afterData: voided,
      notes: dto.voidReason,
    });

    return { voided, reversal };
  }

  // Postgres RAISE EXCEPTION messages come back wrapped by Prisma —
  // this pulls out the clean message for the API response.
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
  // Bank Register view — same transactions, but with running balance
  // and reconciliation "cleared" status attached to each row.
  async getRegister(
    ctx: RequestContext,
    bankAccountId: string,
    view: 'posted' | 'draft',
    dateFrom?: string,
    dateTo?: string,
  ) {
    const registerLocationId = requireLocationId(ctx);

    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        tenantId: ctx.tenantId,
        locationId: registerLocationId,
      },
    });
    if (!account) throw new NotFoundException('Bank account not found');

    const where: any = {
      tenantId: ctx.tenantId,
      locationId: registerLocationId,
      bankAccountId,
      status: view,
    };
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
      if (dateTo) where.transactionDate.lte = new Date(dateTo);
    }

    const txns = await this.prisma.transaction.findMany({
      where,
      orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }],
    });

    // Cleared status: which transaction_ids are matched in a reconciliation for this account
    const clearedRows = await this.prisma.reconciliationLine.findMany({
      where: {
        cleared: true,
        reconciliation: {
          bankAccountId,
          tenantId: ctx.tenantId,
          locationId: registerLocationId,
        },
      },
      select: { transactionId: true },
    });
    const clearedIds = new Set(clearedRows.map((r) => r.transactionId));

    let openingBalance = Number(account.openingBalance);
    if (view === 'posted' && dateFrom) {
      const priorTxns = await this.prisma.transaction.findMany({
        where: {
          tenantId: ctx.tenantId,
          locationId: registerLocationId,
          bankAccountId,
          status: 'posted',
          transactionDate: { lt: new Date(dateFrom) },
        },
        select: { direction: true, amount: true },
      });
      openingBalance += priorTxns.reduce(
        (sum, t) =>
          sum +
          (t.direction === 'inflow' ? Number(t.amount) : -Number(t.amount)),
        0,
      );
    }

    let running = openingBalance;
    const rows = txns.map((t) => {
      if (view === 'posted')
        running +=
          t.direction === 'inflow' ? Number(t.amount) : -Number(t.amount);
      return {
        ...t,
        deposit: t.direction === 'inflow' ? t.amount : null,
        payment: t.direction === 'outflow' ? t.amount : null,
        balance: view === 'posted' ? running : null,
        cleared: clearedIds.has(t.id) ? 'cleared' : 'uncleared',
      };
    });

    return {
      bankAccountId,
      accountName: account.accountName,
      view,
      openingBalance,
      endingBalance: view === 'posted' ? running : null,
      rowCount: rows.length,
      rows,
    };
  }
}
