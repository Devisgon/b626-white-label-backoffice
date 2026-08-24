import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { PrintChecksDto } from './dto/print-checks.dto';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class EPrintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private requireLocation(ctx: RequestContext): string {
    if (!ctx.locationId) {
      throw new BadRequestException('No active location selected.');
    }
    return ctx.locationId;
  }

  // "Checks" tab — posted, outflow transactions not yet printed.
  // onlyPayroll toggles between the two radio options in the UI.
  async listEligibleChecks(ctx: RequestContext, onlyPayroll: boolean) {
    const locationId = this.requireLocation(ctx);

    return this.prisma.transaction.findMany({
      where: {
        tenantId: ctx.tenantId,
        locationId,
        status: 'posted',
        direction: 'outflow',
        isPrinted: false,
        isPayrollCheck: onlyPayroll,
      },
      include: { bankAccount: true, payee: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  // "Print Checks" action — assigns sequential check numbers to the
  // selected transactions, marks them printed, and groups them into
  // a batch for the Print History log.
  async printChecks(ctx: RequestContext, dto: PrintChecksDto) {
    const locationId = this.requireLocation(ctx);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: dto.transactionIds },
        tenantId: ctx.tenantId,
        locationId,
        status: 'posted',
        isPrinted: false,
      },
    });

    if (transactions.length !== dto.transactionIds.length) {
      throw new BadRequestException(
        'One or more selected transactions are not eligible for printing (already printed, not posted, or not found)',
      );
    }

    const startNum = parseInt(dto.startingCheckNumber, 10);
    if (isNaN(startNum)) {
      throw new BadRequestException('startingCheckNumber must be numeric');
    }

    // Order deterministically so check numbers assign predictably.
    const ordered = [...transactions].sort(
      (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const batch = await tx.checkPrintBatch.create({
        data: {
          tenantId: ctx.tenantId,
          locationId,
          startingCheckNumber: dto.startingCheckNumber,
          checkCount: ordered.length,
          printedBy: ctx.userId,
        },
      });

      const updated: any[] = [];
      for (let i = 0; i < ordered.length; i++) {
        const checkNumber = String(startNum + i);
        const row = await tx.transaction.update({
          where: { id: ordered[i].id },
          data: {
            checkNumber,
            isPrinted: true,
            printedAt: new Date(),
            printBatchId: batch.id,
          },
        });
        updated.push(row);
      }

      return { batch, checks: updated };
    });

    await this.auditLog.log(ctx, {
      entityType: 'check_print_batch',
      entityId: result.batch.id,
      action: 'printed',
      afterData: result,
    });

    return result;
  }

  // "Print History" tab
  async getPrintHistory(ctx: RequestContext) {
    const locationId = this.requireLocation(ctx);

    return this.prisma.checkPrintBatch.findMany({
      where: { tenantId: ctx.tenantId, locationId },
      include: {
        transactions: { include: { bankAccount: true, payee: true } },
      },
      orderBy: { printedAt: 'desc' },
    });
  }

  async getBatch(ctx: RequestContext, id: string) {
    const locationId = this.requireLocation(ctx);
    const batch = await this.prisma.checkPrintBatch.findFirst({
      where: { id, tenantId: ctx.tenantId, locationId },
      include: {
        transactions: { include: { bankAccount: true, payee: true } },
      },
    });
    if (!batch) throw new NotFoundException('Print batch not found');
    return batch;
  }
}
