import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimesheetsService } from './timesheets.service';
import { TimesheetNoteDto } from './dto/timesheet-note.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

// IMPORTANT design note: unlike PayrollProfilesController, this controller
// is NOT class-level gated with @RequiresModule/@Roles. Every employee —
// whatever their role — needs to clock in/out and see their own hours,
// even INVENTORY_USER or STORE_MANAGER who have no PAYROLL permission at
// all. Only the admin routes below (findAll / approve / reject) are
// gated per-method to OWNER_ADMIN + FINANCE_USER.
@ApiTags('Payroll — Timesheets')
@ApiBearerAuth('accessToken')
@Controller('api/payroll/timesheets')
export class TimesheetsController {
  constructor(private readonly timesheets: TimesheetsService) {}

  // ---------- Self-service — any authenticated user ----------

  @Post('clock-in')
  @ApiOperation({ summary: 'Start a shift at your currently active location' })
  clockIn(@CurrentUser('id') userId: string, @CurrentUser('tenantId') tenantId: string, @CurrentUser('activeLocationId') locationId: string | null) {
    return this.timesheets.clockIn(tenantId, userId, locationId);
  }

  @Patch(':id/clock-out')
  @ApiOperation({ summary: 'End your currently open shift and record hours worked' })
  clockOut(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: TimesheetNoteDto,
  ) {
    return this.timesheets.clockOut(tenantId, userId, id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Your own timesheet history' })
  mine(@CurrentUser('id') userId: string, @CurrentUser('tenantId') tenantId: string) {
    return this.timesheets.myTimesheets(tenantId, userId);
  }

  // ---------- Admin — OWNER_ADMIN / FINANCE_USER only ----------

  @Get()
  @RequiresModule(ModuleName.PAYROLL)
  @Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
  @ApiOperation({ summary: 'List timesheets across the organization (filter by user, location, status, date)' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('userId') userId?: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.timesheets.findAll(tenantId, { userId, locationId, status, dateFrom, dateTo });
  }

  @Patch(':id/approve')
  @RequiresModule(ModuleName.PAYROLL)
  @Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
  @ApiOperation({ summary: 'Approve a clocked-out timesheet — makes it eligible for the next pay run' })
  approve(
    @CurrentUser('id') adminUserId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: TimesheetNoteDto,
  ) {
    return this.timesheets.approve(tenantId, id, adminUserId, dto);
  }

  @Patch(':id/reject')
  @RequiresModule(ModuleName.PAYROLL)
  @Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
  @ApiOperation({ summary: 'Reject a clocked-out timesheet (e.g. incorrect hours) — excluded from pay runs' })
  reject(
    @CurrentUser('id') adminUserId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: TimesheetNoteDto,
  ) {
    return this.timesheets.reject(tenantId, id, adminUserId, dto);
  }
}