import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AssignRoleDto } from '../auth/dto/assign-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

// Admin-only user management — separate from AuthController since these
// operate on OTHER users, not the currently logged-in user.
@ApiTags('Users (Admin)')
@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Roles(Role.OWNER_ADMIN)
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a user account (Owner/Admin only)' })
  activate(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.authService.setUserActive(tenantId, id, true);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user account (Owner/Admin only)' })
  deactivate(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.authService.setUserActive(tenantId, id, false);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Assign a role to a user (Owner/Admin only)' })
  assignRole(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.authService.assignRole(tenantId, id, dto.role);
  }
}
