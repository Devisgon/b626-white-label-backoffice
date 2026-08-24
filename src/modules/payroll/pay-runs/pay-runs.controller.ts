import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayRunsService } from './pay-runs.service';
import { CreatePayRunDto } from './dto/create-pay-run.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

// Pure admin function — no self-service routes here (unlike Timesheets).
// Running payroll is always an OWNER_ADMIN / FINANCE_USER action.
@ApiTags('Payroll — Pay Runs')
@ApiBearerAuth('accessToken')
@Controller('api/payroll/pay-runs')
@RequiresModule(ModuleName.PAYROLL)
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
export class PayRunsController {
  constructor(private readonly payRuns: PayRunsService) {}

  @Get()
  @ApiOperation({ summary: 'List pay runs — optionally filter by location or status' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: string,
  ) {
    return this.payRuns.findAll(tenantId, locationId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one pay run with its per-employee items and totals' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.payRuns.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a DRAFT pay run for a location + period' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreatePayRunDto) {
    return this.payRuns.create(tenantId, dto);
  }

  @Patch(':id/process')
  @ApiOperation({
    summary:
      'Run the calculation engine — pulls approved timesheets + active deductions and generates pay items. One-shot: only works on a DRAFT run.',
  })
  process(@CurrentUser('id') adminUserId: string, @CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.payRuns.process(tenantId, id, adminUserId);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark a PROCESSED pay run as PAID (e.g. after bank transfers go out)' })
  markPaid(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.payRuns.markPaid(tenantId, id);
  }
}