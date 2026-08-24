import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ModuleName, PermissionAction, Role as PrismaRole } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { SetUserPermissionDto } from './dto/set-user-permission.dto';
import { ToggleLocationModuleDto } from './dto/toggle-location-module.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

// Everything here is OWNER_ADMIN only — this is the "admin manages
// permissions" surface. Regular users never call these endpoints; they
// just get let in or blocked by ModulePermissionGuard based on what an
// admin has configured here.
@ApiTags('Permissions')
@ApiBearerAuth('accessToken')
@Controller('api/permissions')
@Roles(Role.OWNER_ADMIN)
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Full catalog of permissions that exist (module x action pairs)' })
  listPermissions() {
    return this.permissions.listPermissions();
  }

  @Get('roles/:role')
  @ApiOperation({ summary: 'Default permissions a given role has out of the box' })
  getRolePermissions(@Param('role', new ParseEnumPipe(PrismaRole)) role: PrismaRole) {
    return this.permissions.getRolePermissions(role);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Effective permissions for a specific user (role defaults + their overrides)' })
  getUserPermissions(@Param('userId') userId: string) {
    return this.permissions.getUserPermissionsDetail(userId);
  }

  @Patch('users/:userId')
  @ApiOperation({ summary: 'Grant or revoke one permission for a specific user, on top of their role default' })
  setUserPermission(
    @Param('userId') userId: string,
    @Body() dto: SetUserPermissionDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.permissions.setUserPermission(userId, dto.module, dto.action, dto.granted, adminUserId);
  }

  @Delete('users/:userId/override')
  @ApiOperation({ summary: 'Remove a per-user override — user falls back to their role default for this permission' })
  clearUserPermissionOverride(
    @Param('userId') userId: string,
    @Query('module', new ParseEnumPipe(ModuleName)) module: ModuleName,
    @Query('action', new ParseEnumPipe(PermissionAction)) action: PermissionAction,
  ) {
    return this.permissions.clearUserPermissionOverride(userId, module, action);
  }

  @Get('locations/:locationId/modules')
  @ApiOperation({ summary: 'Which modules are enabled/disabled for a given location' })
  getLocationModules(@Param('locationId') locationId: string) {
    return this.permissions.getLocationModules(locationId);
  }

  @Patch('locations/:locationId/modules')
  @ApiOperation({ summary: 'Enable or disable a module for a given location' })
  setLocationModule(@Param('locationId') locationId: string, @Body() dto: ToggleLocationModuleDto) {
    return this.permissions.setLocationModule(locationId, dto.module, dto.enabled);
  }
}