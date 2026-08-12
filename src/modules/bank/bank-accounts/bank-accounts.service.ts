import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { requireLocationId } from '../../../common/context/request-context.store';

@Injectable()
export class BankAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(ctx: RequestContext, dto: CreateBankAccountDto) {
    const locationId = requireLocationId(ctx);

    const existing = await this.prisma.bankAccount.findFirst({
      where: {
        tenantId: ctx.tenantId,
        locationId,
        institution: dto.institution,
        lastFour: dto.lastFour,
        status: { not: 'closed' },
      },
    });

    if (existing) {
      throw new ConflictException(
        'An active account with this institution and last 4 digits already exists',
      );
    }

    const data = await this.prisma.bankAccount.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        accountName: dto.accountName,
        institution: dto.institution,
        accountType: dto.accountType,
        lastFour: dto.lastFour,
        openingBalance: dto.openingBalance,
        currentBalance: dto.openingBalance,
        openingDate: new Date(dto.openingDate),
        status: 'active',
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      },
    });

    await this.auditLog.log(ctx, {
      entityType: 'bank_account',
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

    const where: any = {
      tenantId: ctx.tenantId,
      locationId: requireLocationId(ctx),
    };
    if (status) where.status = status;
    if (type) where.accountType = type;
    if (search) {
      where.OR = [
        { accountName: { contains: search, mode: 'insensitive' } },
        { institution: { contains: search, mode: 'insensitive' } },
        { lastFour: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bankAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bankAccount.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(ctx: RequestContext, id: string) {
    const data = await this.prisma.bankAccount.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId: requireLocationId(ctx) },
    });

    if (!data) throw new NotFoundException('Bank account not found');
    return data;
  }

  async update(ctx: RequestContext, id: string, dto: UpdateBankAccountDto) {
    const before = await this.findOne(ctx, id);

    const payload: any = { updatedBy: ctx.userId, updatedAt: new Date() };
    if (dto.accountName !== undefined) payload.accountName = dto.accountName;
    if (dto.institution !== undefined) payload.institution = dto.institution;
    if (dto.accountType !== undefined) payload.accountType = dto.accountType;
    if (dto.lastFour !== undefined) payload.lastFour = dto.lastFour;
    if (dto.openingBalance !== undefined) payload.openingBalance = dto.openingBalance;
    if (dto.openingDate !== undefined) payload.openingDate = new Date(dto.openingDate);
    if (dto.status !== undefined) payload.status = dto.status;

    const data = await this.prisma.bankAccount.update({
      where: { id },
      data: payload,
    });

    await this.auditLog.log(ctx, {
      entityType: 'bank_account',
      entityId: id,
      action: 'updated',
      beforeData: before,
      afterData: data,
    });

    return data;
  }

  async remove(ctx: RequestContext, id: string) {
    const before = await this.findOne(ctx, id);

    const data = await this.prisma.bankAccount.update({
      where: { id },
      data: { status: 'closed', updatedBy: ctx.userId, updatedAt: new Date() },
    });

    await this.auditLog.log(ctx, {
      entityType: 'bank_account',
      entityId: id,
      action: 'closed',
      beforeData: before,
      afterData: data,
    });

    return data;
  }

  async getStatement(
    ctx: RequestContext,
    id: string,
    dateFrom: string,
    dateTo: string,
  ) {
    const account = await this.findOne(ctx, id);

    const statementLocationId = requireLocationId(ctx);

    const priorTxns = await this.prisma.transaction.findMany({
      where: {
        tenantId: ctx.tenantId,
        locationId: statementLocationId,
        bankAccountId: id,
        status: 'posted',
        transactionDate: { lt: new Date(dateFrom) },
      },
      select: { direction: true, amount: true },
    });

    const priorNet = priorTxns.reduce(
      (sum, t) => sum + (t.direction === 'inflow' ? Number(t.amount) : -Number(t.amount)),
      0,
    );
    const openingBalance = Number(account.openingBalance) + priorNet;

    const periodTxns = await this.prisma.transaction.findMany({
      where: {
        tenantId: ctx.tenantId,
        locationId: statementLocationId,
        bankAccountId: id,
        status: 'posted',
        transactionDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      orderBy: { transactionDate: 'asc' },
    });

    const totalInflow = periodTxns
      .filter((t) => t.direction === 'inflow')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalOutflow = periodTxns
      .filter((t) => t.direction === 'outflow')
      .reduce((s, t) => s + Number(t.amount), 0);
    const closingBalance = openingBalance + totalInflow - totalOutflow;

    return {
      bankAccountId: id,
      accountName: account.accountName,
      institution: account.institution,
      statementPeriod: { dateFrom, dateTo },
      openingBalance,
      closingBalance,
      totalInflow,
      totalOutflow,
      transactionCount: periodTxns.length,
      transactions: periodTxns,
    };
  }
}