import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThemeService } from './theme.service';
import { SelectThemeDto } from './dto/select-theme.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Settings — Theme')
@ApiBearerAuth('accessToken')
@Controller('api/settings/theme')
export class ThemeController {
  // Self-service — every logged-in user needs this to render the frontend
  // in the tenant's chosen theme, so it's open to any role.
  @Get()
  @ApiOperation({ summary: "Get your tenant's selected theme key" })
  getMyTheme(@CurrentUser('tenantId') tenantId: string) {
    return this.theme.getMyTheme(tenantId);
  }

  // Admin-only — changing the store's theme.
  @Patch()
  @RequiresModule(ModuleName.SETTINGS)
  @Roles(Role.OWNER_ADMIN)
  @ApiOperation({ summary: "Select your store's theme" })
  selectTheme(@CurrentUser('tenantId') tenantId: string, @Body() dto: SelectThemeDto) {
    return this.theme.selectTheme(tenantId, dto.themeKey);
  }

  constructor(private readonly theme: ThemeService) {}
}