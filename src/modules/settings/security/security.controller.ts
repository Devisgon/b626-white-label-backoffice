import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { UpdateSecurityPolicyDto } from './dto/update-security-policy.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Settings — Security')
@ApiBearerAuth('accessToken')
@Controller('api/settings/security')
@RequiresModule(ModuleName.SETTINGS)
@Roles(Role.OWNER_ADMIN)
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Get()
  @ApiOperation({ summary: 'Get security policy (password rules, session timeout, 2FA requirement)' })
  get(@CurrentUser('tenantId') tenantId: string) {
    return this.security.get(tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Update security policy' })
  update(@CurrentUser('tenantId') tenantId: string, @Body() dto: UpdateSecurityPolicyDto) {
    return this.security.update(tenantId, dto);
  }
}