import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductAuditLog } from './interfaces/audit.interface';

@Injectable()
export class ProductAuditService {
  private readonly logger = new Logger(ProductAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes an audit record. Pass the active Prisma transaction client (`tx`)
   * when logging as part of a create/update/delete/restore transaction so the
   * audit row commits or rolls back atomically with the product change.
   * Falls back to a standalone write (e.g. from the CSV importer's per-row
   * transaction) when no transaction client is supplied.
   */
  async log(
    data: ProductAuditLog,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    try {
      const client = tx ?? this.prisma;

      await client.product_audit_logs.create({
        // tenant_id is injected automatically by the tenant-scoping Prisma
        // extension (see src/prisma/tenant-scoping.extension.ts)
        data: {
          product_id: BigInt(data.product_id),
          action: data.action,
          description: data.description ?? null,
          old_data: data.old_data ?? Prisma.JsonNull,
          new_data: data.new_data ?? Prisma.JsonNull,
          performed_by: data.performed_by ?? null,
        } as any,
      });
    } catch (error: any) {
      // Audit logging must never block the primary operation; log and continue.
      this.logger.error(`Failed to write audit log: ${error.message}`);
    }
  }
}
