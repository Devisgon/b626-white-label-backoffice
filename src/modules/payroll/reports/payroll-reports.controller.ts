import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayrollReportsService } from './payroll-reports.service';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Payroll — Reports')
@ApiBearerAuth('accessToken')
@Controller('api/payroll/reports')
@RequiresModule(ModuleName.PAYROLL)
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
export class PayrollReportsController {
  constructor(private readonly reports: PayrollReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Total payroll cost across processed/paid runs — optionally filter by location and date range' })
  summary(
    @CurrentUser('tenantId') tenantId: string,
    @Query('locationId') locationId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.reports.summary(tenantId, locationId, periodStart, periodEnd);
  }

  @Get('by-location')
  @ApiOperation({ summary: 'Payroll cost broken down per location' })
  byLocation(
    @CurrentUser('tenantId') tenantId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.reports.byLocation(tenantId, periodStart, periodEnd);
  }
}