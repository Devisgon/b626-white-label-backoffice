import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { requireLocationId } from '../../../common/context/request-context.store';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  notes?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  // Called internally by other services right after a financial action
  // succeeds. Never throws to the caller on failure — logging a failure
  // should not roll back a successful business operation.
  async log(ctx: RequestContext, entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.bankingAuditLog.create({
        data: {
          tenantId: ctx.tenantId,
          locationId: requireLocationId(ctx),
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          performedBy: ctx.userId ?? null,
          beforeData: entry.beforeData ?? undefined,
          afterData: entry.afterData ?? undefined,
          notes: entry.notes ?? null,
        },
      });
    } catch (error: any) {
      console.error('Failed to write audit log:', error.message, entry);
    }
  }

  async findAll(
    ctx: RequestContext,
    page: number,
    limit: number,
    entityType?: string,
    entityId?: string,
    action?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const where: any = {
      tenantId: ctx.tenantId,
      locationId: ctx.locationId,
    };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lt = new Date(`${dateTo}T23:59:59.999Z`);
    }

    const [data, total] = await Promise.all([
      this.prisma.bankingAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bankingAuditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
