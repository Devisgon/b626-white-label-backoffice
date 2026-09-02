import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayrollProfilesService } from './payroll-profiles.service';
import { UpsertPayrollProfileDto } from './dto/upsert-payroll-profile.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

// Day 1 slice of the Payroll module — just the employee pay-rate profile.
// Timesheets, Pay Runs, Deductions, Leave and Payslips are separate
// controllers added on Day 2/3/4/5, all under the same PAYROLL module tag.
@ApiTags('Payroll — Profiles')
@ApiBearerAuth('accessToken')
@Controller('api/payroll/profiles')
@RequiresModule(ModuleName.PAYROLL)
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
export class PayrollProfilesController {
  constructor(private readonly profiles: PayrollProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List payroll profiles for every employee in your organization' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.profiles.findAll(tenantId);
  }

  @Get(':userId')
  @ApiOperation({ summary: "Get one employee's payroll profile" })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.profiles.findOne(tenantId, userId);
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Create or update an employee\'s pay rate / pay type / direct-deposit account' })
  upsert(
    @CurrentUser('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpsertPayrollProfileDto,
  ) {
    return this.profiles.upsert(tenantId, userId, dto);
  }

  @Patch(':userId/deactivate')
  @ApiOperation({ summary: 'Stop including this employee in future payroll runs (e.g. after termination)' })
  deactivate(@CurrentUser('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.profiles.setActive(tenantId, userId, false);
  }

  @Patch(':userId/reactivate')
  @ApiOperation({ summary: 'Resume including this employee in payroll runs' })
  reactivate(@CurrentUser('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.profiles.setActive(tenantId, userId, true);
  }
}