import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeductionsService } from './deductions.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { UpdateDeductionDto } from './dto/update-deduction.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Payroll — Deductions')
@ApiBearerAuth('accessToken')
@Controller('api/payroll/deductions')
@RequiresModule(ModuleName.PAYROLL)
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
export class DeductionsController {
  constructor(private readonly deductions: DeductionsService) {}

  @Get()
  @ApiOperation({ summary: "List deductions — optionally filter by employee" })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('userId') userId?: string) {
    return this.deductions.findAll(tenantId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a deduction (tax, insurance, loan, other) for an employee' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateDeductionDto) {
    return this.deductions.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deduction\'s amount, active status, or note' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateDeductionDto) {
    return this.deductions.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deduction' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.deductions.remove(tenantId, id);
  }
}