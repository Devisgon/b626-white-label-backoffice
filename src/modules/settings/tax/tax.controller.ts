import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

// Admin-only, same as Store Profile — tax rates are store configuration,
// not something regular staff touch.
@ApiTags('Settings — Tax')
@ApiBearerAuth('accessToken')
@Controller('api/settings/tax-rules')
@RequiresModule(ModuleName.SETTINGS)
@Roles(Role.OWNER_ADMIN)
export class TaxController {
  constructor(private readonly tax: TaxService) {}

  @Get()
  @ApiOperation({ summary: 'List tax rules — optionally scoped to one location' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('locationId') locationId?: string) {
    return this.tax.findAll(tenantId, locationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a tax rule (e.g. "Standard GST" at 17%)' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateTaxRuleDto) {
    return this.tax.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax rule\'s name, rate, or active status' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateTaxRuleDto) {
    return this.tax.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax rule' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.tax.remove(tenantId, id);
  }
}