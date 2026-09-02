import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PayslipsService {
  constructor(private prisma: PrismaService) {}

  // Every payslip ever generated for this employee, newest first, with
  // the pay run's period/location attached so it reads like a real
  // payslip list, not just raw PayRunItem rows.
  async myPayslips(userId: string) {
    const items = await this.prisma.payRunItem.findMany({
      where: { userId },
      include: { payRun: { include: { location: { select: { id: true, name: true } } } } },
      orderBy: { payRun: { periodStart: 'desc' } },
    });

    return items.map((item) => ({
      id: item.id,
      payRunId: item.payRunId,
      location: item.payRun.location,
      periodStart: item.payRun.periodStart,
      periodEnd: item.payRun.periodEnd,
      status: item.payRun.status,
      regularHours: item.regularHours,
      overtimeHours: item.overtimeHours,
      grossPay: item.grossPay,
      totalDeductions: item.totalDeductions,
      netPay: item.netPay,
    }));
  }

  // Admin viewing one specific employee's payslip history — same shape,
  // scoped to tenant for safety.
  async forEmployee(tenantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found in your organization');
    }
    return this.myPayslips(userId);
  }
}