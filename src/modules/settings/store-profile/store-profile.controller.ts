import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreProfileService } from './store-profile.service';
import { UpdateStoreProfileDto } from './dto/update-store-profile.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

// Day 1 slice of the Settings module — just the store identity/profile
// screen. Tax, Receipt, Payment Methods, Notifications, Security and
// Integrations are separate controllers added Day 2–5, all under the same
// SETTINGS module tag. Admin-only — regular staff never edit store config.
@ApiTags('Settings — Store Profile')
@ApiBearerAuth('accessToken')
@Controller('api/settings/store-profile')
@RequiresModule(ModuleName.SETTINGS)
@Roles(Role.OWNER_ADMIN)
export class StoreProfileController {
  constructor(private readonly storeProfile: StoreProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get your store profile (name, logo, contact, timezone, currency)' })
  get(@CurrentUser('tenantId') tenantId: string) {
    return this.storeProfile.get(tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Update your store profile' })
  update(@CurrentUser('tenantId') tenantId: string, @Body() dto: UpdateStoreProfileDto) {
    return this.storeProfile.update(tenantId, dto);
  }
}