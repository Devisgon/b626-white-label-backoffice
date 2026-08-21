import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePayRunDto } from './dto/create-pay-run.dto';

@Injectable()
export class PayRunsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePayRunDto) {
    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location || location.tenantId !== tenantId) {
      throw new NotFoundException('Location not found in your organization');
    }

    return this.prisma.payRun.create({
      data: {
        tenantId,
        locationId: dto.locationId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
    });
  }

  async findAll(tenantId: string, locationId?: string, status?: string) {
    return this.prisma.payRun.findMany({
      where: { tenantId, ...(locationId ? { locationId } : {}), ...(status ? { status: status as any } : {}) },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const payRun = await this.getOwnedPayRun(tenantId, id, {
      items: { include: { user: { select: { id: true, name: true, email: true } } } },
    });

    const totalGross = payRun.items.reduce((sum, i) => sum + Number(i.grossPay), 0);
    const totalDeductions = payRun.items.reduce((sum, i) => sum + Number(i.totalDeductions), 0);
    const totalNet = payRun.items.reduce((sum, i) => sum + Number(i.netPay), 0);

    return { ...payRun, totals: { totalGross, totalDeductions, totalNet } };
  }

  // ---------- The calculation engine ----------
  //
  // For every employee who (a) has access to this pay run's location and
  // (b) has an active PayrollProfile:
  //   - HOURLY: sum their APPROVED timesheets at this location within the
  //     period -> regularHours/overtimeHours -> grossPay = regular*rate +
  //     overtime*overtimeRate. Employees with zero approved hours in the
  //     period are skipped (nothing to pay).
  //   - SALARY: fixed baseRate for the period, minus a per-day deduction
  //     for any APPROVED UNPAID leave inside the period.
  //   - Deductions: sum their active Deduction rows.
  //   - netPay = grossPay - totalDeductions.
  // Only a DRAFT pay run can be processed, and processing is one-shot —
  // rerunning a PROCESSED/PAID run is blocked to avoid silently changing
  // numbers after they've been reviewed or paid out.
  async process(tenantId: string, id: string, adminUserId: string) {
    const payRun = await this.getOwnedPayRun(tenantId, id);
    if (payRun.status !== 'DRAFT') {
      throw new BadRequestException(`Pay run is already ${payRun.status} — cannot reprocess`);
    }

    const employees = await this.prisma.user.findMany({
      where: {
        tenantId,
        locationAccess: { some: { locationId: payRun.locationId } },
        payrollProfile: { isActive: true },
      },
      include: { payrollProfile: true },
    });

    const items: {
      userId: string;
      regularHours: number;
      overtimeHours: number;
      grossPay: number;
      totalDeductions: number;
      netPay: number;
    }[] = [];

    for (const employee of employees) {
      const profile = employee.payrollProfile!;
      let regularHours = 0;
      let overtimeHours = 0;
      let grossPay = 0;

      if (profile.payType === 'HOURLY') {
        const timesheets = await this.prisma.timesheet.findMany({
          where: {
            userId: employee.id,
            locationId: payRun.locationId,
            status: 'APPROVED',
            clockIn: { gte: payRun.periodStart, lte: payRun.periodEnd },
          },
        });
        regularHours = timesheets.reduce((sum, t) => sum + Number(t.regularHours ?? 0), 0);
        overtimeHours = timesheets.reduce((sum, t) => sum + Number(t.overtimeHours ?? 0), 0);
        if (regularHours === 0 && overtimeHours === 0) continue; // nothing to pay

        const overtimeRate = profile.overtimeRate ? Number(profile.overtimeRate) : Number(profile.baseRate) * 1.5;
        grossPay = regularHours * Number(profile.baseRate) + overtimeHours * overtimeRate;
      } else {
        // SALARY — fixed amount for the period, minus a per-day deduction
        // for any APPROVED UNPAID leave that falls inside this period.
        // Paid leave (SICK/CASUAL/PAID) does not reduce salary.
        grossPay = Number(profile.baseRate);

        const unpaidLeaveDays = await this.prisma.leaveRequest.findMany({
          where: {
            userId: employee.id,
            leaveType: 'UNPAID',
            status: 'APPROVED',
            startDate: { lte: payRun.periodEnd },
            endDate: { gte: payRun.periodStart },
          },
        });
        if (unpaidLeaveDays.length > 0) {
          const periodDays =
            Math.round((payRun.periodEnd.getTime() - payRun.periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const perDayRate = Number(profile.baseRate) / periodDays;
          const totalUnpaidDays = unpaidLeaveDays.reduce((sum, l) => {
            const overlapStart = l.startDate > payRun.periodStart ? l.startDate : payRun.periodStart;
            const overlapEnd = l.endDate < payRun.periodEnd ? l.endDate : payRun.periodEnd;
            const days = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return sum + Math.max(days, 0);
          }, 0);
          grossPay = Math.max(grossPay - perDayRate * totalUnpaidDays, 0);
        }
      }

      const deductions = await this.prisma.deduction.findMany({
        where: { userId: employee.id, isActive: true },
      });
      const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);

      items.push({
        userId: employee.id,
        regularHours: Math.round(regularHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        grossPay: Math.round(grossPay * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netPay: Math.round((grossPay - totalDeductions) * 100) / 100,
      });
    }

    if (items.length === 0) {
      throw new BadRequestException(
        'No employees with approved timesheets or active salaried profiles found for this location/period',
      );
    }

    await this.prisma.$transaction([
      this.prisma.payRunItem.deleteMany({ where: { payRunId: payRun.id } }),
      this.prisma.payRunItem.createMany({
        data: items.map((i) => ({ ...i, payRunId: payRun.id })),
      }),
      this.prisma.payRun.update({
        where: { id: payRun.id },
        data: { status: 'PROCESSED', runBy: adminUserId, runAt: new Date() },
      }),
      // One-time (non-recurring) deductions only ever get charged once —
      // deactivate them now that they've been baked into this pay run.
      this.prisma.deduction.updateMany({
        where: { userId: { in: items.map((i) => i.userId) }, isRecurring: false, isActive: true },
        data: { isActive: false },
      }),
    ]);

    return this.findOne(tenantId, payRun.id);
  }

  async markPaid(tenantId: string, id: string) {
    const payRun = await this.getOwnedPayRun(tenantId, id);
    if (payRun.status !== 'PROCESSED') {
      throw new BadRequestException('Only a PROCESSED pay run can be marked as PAID');
    }
    return this.prisma.payRun.update({ where: { id: payRun.id }, data: { status: 'PAID' } });
  }

  private async getOwnedPayRun(tenantId: string, id: string, include?: any) {
    const payRun = await this.prisma.payRun.findUnique({ where: { id }, include });
    if (!payRun || payRun.tenantId !== tenantId) {
      throw new NotFoundException('Pay run not found');
    }
    return payRun;
  }
}