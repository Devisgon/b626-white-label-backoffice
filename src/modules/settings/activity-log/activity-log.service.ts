import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ActivityEntry {
  source: 'AUTH' | 'BANKING' | 'CATALOGUE';
  action: string;
  performedBy: string | null;
  createdAt: Date;
  details?: string | null;
}

const FETCH_PER_SOURCE = 200; // pull a bit extra from each table before merging, so the final sorted+sliced list is accurate

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  // Three separate audit tables (Auth's AuditLog, Banking's
  // BankingAuditLog, Catalogue's product_audit_logs) predate this module
  // and have different shapes — this normalizes all three into one common
  // ActivityEntry shape, merges, and sorts by time. Pulling a capped batch
  // from each source (rather than one giant UNION query) keeps this simple
  // and fast enough for a settings screen; a dedicated activity table fed
  // by all three modules would be the next step if volume grows.
  async list(tenantId: string, dateFrom?: string, dateTo?: string, source?: string, limit = 50) {
    const dateFilter =
      dateFrom || dateTo
        ? {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
          }
        : undefined;

    const wantsSource = (s: ActivityEntry['source']) => !source || source.toUpperCase() === s;

    const [authLogs, bankingLogs, catalogueLogs] = await Promise.all([
      wantsSource('AUTH')
        ? this.prisma.auditLog.findMany({
            where: { tenantId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
            orderBy: { createdAt: 'desc' },
            take: FETCH_PER_SOURCE,
          })
        : Promise.resolve([]),
      wantsSource('BANKING')
        ? this.prisma.bankingAuditLog.findMany({
            where: { tenantId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
            orderBy: { createdAt: 'desc' },
            take: FETCH_PER_SOURCE,
          })
        : Promise.resolve([]),
      wantsSource('CATALOGUE')
        ? this.prisma.product_audit_logs.findMany({
            where: { tenant_id: tenantId, ...(dateFilter ? { created_at: dateFilter } : {}) },
            orderBy: { created_at: 'desc' },
            take: FETCH_PER_SOURCE,
          })
        : Promise.resolve([]),
    ]);

    const entries: ActivityEntry[] = [
      ...authLogs.map((l) => ({
        source: 'AUTH' as const,
        action: l.action,
        performedBy: l.userId,
        createdAt: l.createdAt,
        details: l.metadata ? JSON.stringify(l.metadata) : null,
      })),
      ...bankingLogs.map((l) => ({
        source: 'BANKING' as const,
        action: l.action,
        performedBy: l.performedBy,
        createdAt: l.createdAt,
        details: l.notes,
      })),
      ...catalogueLogs.map((l) => ({
        source: 'CATALOGUE' as const,
        action: l.action ?? 'UNKNOWN',
        performedBy: l.performed_by,
        createdAt: l.created_at!,
        details: l.description,
      })),
    ];

    entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return entries.slice(0, limit);
  }
}