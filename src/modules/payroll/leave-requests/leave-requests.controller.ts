import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveDecisionDto } from './dto/leave-decision.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

// Same access-control shape as Timesheets: requesting leave and viewing
// your own history is open to every employee regardless of role; only the
// admin routes (findAll, approve, reject) are gated to OWNER_ADMIN/FINANCE_USER.
@ApiTags('Payroll — Leave Requests')
@ApiBearerAuth('accessToken')
@Controller('api/payroll/leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequests: LeaveRequestsService) {}

  // ---------- Self-service ----------

  @Post()
  @ApiOperation({ summary: 'Request leave for yourself' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.leaveRequests.create(tenantId, userId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Your own leave request history' })
  mine(@CurrentUser('id') userId: string, @CurrentUser('tenantId') tenantId: string) {
    return this.leaveRequests.myRequests(tenantId, userId);
  }

  // ---------- Admin ----------

  @Get()
  @RequiresModule(ModuleName.PAYROLL)
  @Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
  @ApiOperation({ summary: 'List leave requests across the organization' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.leaveRequests.findAll(tenantId, status, userId);
  }

  @Patch(':id/approve')
  @RequiresModule(ModuleName.PAYROLL)
  @Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
  @ApiOperation({ summary: 'Approve a pending leave request' })
  approve(
    @CurrentUser('id') adminUserId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() _dto: LeaveDecisionDto,
  ) {
    return this.leaveRequests.decide(tenantId, id, adminUserId, 'APPROVED');
  }

  @Patch(':id/reject')
  @RequiresModule(ModuleName.PAYROLL)
  @Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
  @ApiOperation({ summary: 'Reject a pending leave request' })
  reject(
    @CurrentUser('id') adminUserId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() _dto: LeaveDecisionDto,
  ) {
    return this.leaveRequests.decide(tenantId, id, adminUserId, 'REJECTED');
  }
}