import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PayrollReportsService {
  constructor(private prisma: PrismaService) {}

  // Overall cost summary across every PROCESSED/PAID pay run matching the
  // filters — the "how much did payroll cost us" number an owner checks
  // before/after a period closes.
  async summary(tenantId: string, locationId?: string, periodStart?: string, periodEnd?: string) {
    const payRuns = await this.prisma.payRun.findMany({
      where: {
        tenantId,
        status: { in: ['PROCESSED', 'PAID'] },
        ...(locationId ? { locationId } : {}),
        ...(periodStart ? { periodStart: { gte: new Date(periodStart) } } : {}),
        ...(periodEnd ? { periodEnd: { lte: new Date(periodEnd) } } : {}),
      },
      include: { items: true, location: { select: { id: true, name: true } } },
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    const employeeIds = new Set<string>();

    for (const run of payRuns) {
      for (const item of run.items) {
        totalGross += Number(item.grossPay);
        totalDeductions += Number(item.totalDeductions);
        totalNet += Number(item.netPay);
        totalRegularHours += Number(item.regularHours);
        totalOvertimeHours += Number(item.overtimeHours);
        employeeIds.add(item.userId);
      }
    }

    return {
      payRunCount: payRuns.length,
      employeeCount: employeeIds.size,
      totalRegularHours,
      totalOvertimeHours,
      totalGross,
      totalDeductions,
      totalNet,
    };
  }

  // Same numbers, broken down per location — useful for a multi-store
  // owner comparing payroll cost across branches.
  async byLocation(tenantId: string, periodStart?: string, periodEnd?: string) {
    const payRuns = await this.prisma.payRun.findMany({
      where: {
        tenantId,
        status: { in: ['PROCESSED', 'PAID'] },
        ...(periodStart ? { periodStart: { gte: new Date(periodStart) } } : {}),
        ...(periodEnd ? { periodEnd: { lte: new Date(periodEnd) } } : {}),
      },
      include: { items: true, location: { select: { id: true, name: true } } },
    });

    const byLocation = new Map<string, { locationName: string; totalGross: number; totalNet: number; employeeCount: Set<string> }>();

    for (const run of payRuns) {
      const key = run.locationId;
      if (!byLocation.has(key)) {
        byLocation.set(key, { locationName: run.location.name, totalGross: 0, totalNet: 0, employeeCount: new Set() });
      }
      const bucket = byLocation.get(key)!;
      for (const item of run.items) {
        bucket.totalGross += Number(item.grossPay);
        bucket.totalNet += Number(item.netPay);
        bucket.employeeCount.add(item.userId);
      }
    }

    return Array.from(byLocation.entries()).map(([locationId, data]) => ({
      locationId,
      locationName: data.locationName,
      totalGross: data.totalGross,
      totalNet: data.totalNet,
      employeeCount: data.employeeCount.size,
    }));
  }
}