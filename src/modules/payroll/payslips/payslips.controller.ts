import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayslipsService } from './payslips.service';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Payroll — Payslips')
@ApiBearerAuth('accessToken')
@Controller('api/payroll/payslips')
export class PayslipsController {
  constructor(private readonly payslips: PayslipsService) {}

  // Self-service — every employee can see their own payslips, no matter
  // their role, same as Timesheets/Leave "mine" routes.
  @Get('mine')
  @ApiOperation({ summary: 'Your own payslip history across every processed pay run' })
  mine(@CurrentUser('id') userId: string) {
    return this.payslips.myPayslips(userId);
  }

  // Admin — looking up a specific employee's payslips.
  @Get(':userId')
  @RequiresModule(ModuleName.PAYROLL)
  @Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
  @ApiOperation({ summary: "One employee's payslip history" })
  forEmployee(@CurrentUser('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.payslips.forEmployee(tenantId, userId);
  }
}