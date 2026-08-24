import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Settings — Integrations')
@ApiBearerAuth('accessToken')
@Controller('api/settings/integrations')
@RequiresModule(ModuleName.SETTINGS)
@Roles(Role.OWNER_ADMIN)
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'List connected third-party integrations (API keys are never returned)' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.integrations.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Connect a third-party provider with an API key' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateIntegrationDto) {
    return this.integrations.create(tenantId, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an integration without deleting it' })
  deactivate(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.integrations.setActive(tenantId, id, false);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a previously deactivated integration' })
  reactivate(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.integrations.setActive(tenantId, id, true);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an integration permanently' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.integrations.remove(tenantId, id);
  }
}