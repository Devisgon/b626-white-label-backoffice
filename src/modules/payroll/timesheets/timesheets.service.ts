import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TimesheetNoteDto } from './dto/timesheet-note.dto';

const REGULAR_HOURS_PER_DAY = 8;

@Injectable()
export class TimesheetsService {
  constructor(private prisma: PrismaService) {}

  // Hours worked beyond REGULAR_HOURS_PER_DAY in a single shift count as
  // overtime — the simplest, most common rule (per-shift, not per
  // calendar-week). Rounded to 2 decimal places since PayrollProfile
  // rates are stored the same way.
  private computeHours(clockIn: Date, clockOut: Date) {
    const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    const regularHours = Math.min(totalHours, REGULAR_HOURS_PER_DAY);
    const overtimeHours = Math.max(totalHours - REGULAR_HOURS_PER_DAY, 0);
    return {
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
    };
  }

  async clockIn(tenantId: string, userId: string, locationId: string | null) {
    if (!locationId) {
      throw new BadRequestException('Select an active location before clocking in');
    }

    const openShift = await this.prisma.timesheet.findFirst({
      where: { userId, clockOut: null },
    });
    if (openShift) {
      throw new BadRequestException('You already have an open shift — clock out of it first');
    }

    return this.prisma.timesheet.create({
      data: { tenantId, userId, locationId, clockIn: new Date() },
    });
  }

  async clockOut(tenantId: string, userId: string, timesheetId: string, dto: TimesheetNoteDto) {
    const timesheet = await this.prisma.timesheet.findUnique({ where: { id: timesheetId } });
    if (!timesheet || timesheet.tenantId !== tenantId) {
      throw new NotFoundException('Timesheet not found');
    }
    if (timesheet.userId !== userId) {
      throw new ForbiddenException('You can only clock out of your own shift');
    }
    if (timesheet.clockOut) {
      throw new BadRequestException('This shift is already clocked out');
    }

    const clockOut = new Date();
    const { regularHours, overtimeHours } = this.computeHours(timesheet.clockIn, clockOut);

    return this.prisma.timesheet.update({
      where: { id: timesheetId },
      data: { clockOut, regularHours, overtimeHours, notes: dto.notes },
    });
  }

  async myTimesheets(tenantId: string, userId: string) {
    return this.prisma.timesheet.findMany({
      where: { tenantId, userId },
      orderBy: { clockIn: 'desc' },
    });
  }

  // ---------- Admin (OWNER_ADMIN / FINANCE_USER) ----------

  async findAll(
    tenantId: string,
    filters: { userId?: string; locationId?: string; status?: string; dateFrom?: string; dateTo?: string },
  ) {
    const where: any = { tenantId };
    if (filters.userId) where.userId = filters.userId;
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.clockIn = {};
      if (filters.dateFrom) where.clockIn.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.clockIn.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    }

    return this.prisma.timesheet.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { clockIn: 'desc' },
    });
  }

  async approve(tenantId: string, timesheetId: string, adminUserId: string, dto: TimesheetNoteDto) {
    const timesheet = await this.getApprovableTimesheet(tenantId, timesheetId);

    return this.prisma.timesheet.update({
      where: { id: timesheet.id },
      data: {
        status: 'APPROVED',
        approvedBy: adminUserId,
        approvedAt: new Date(),
        notes: dto.notes ?? timesheet.notes,
      },
    });
  }

  async reject(tenantId: string, timesheetId: string, adminUserId: string, dto: TimesheetNoteDto) {
    const timesheet = await this.getApprovableTimesheet(tenantId, timesheetId);

    return this.prisma.timesheet.update({
      where: { id: timesheet.id },
      data: {
        status: 'REJECTED',
        approvedBy: adminUserId,
        approvedAt: new Date(),
        notes: dto.notes ?? timesheet.notes,
      },
    });
  }

  private async getApprovableTimesheet(tenantId: string, timesheetId: string) {
    const timesheet = await this.prisma.timesheet.findUnique({ where: { id: timesheetId } });
    if (!timesheet || timesheet.tenantId !== tenantId) {
      throw new NotFoundException('Timesheet not found');
    }
    if (!timesheet.clockOut) {
      throw new BadRequestException('This shift has not been clocked out yet');
    }
    return timesheet;
  }
}