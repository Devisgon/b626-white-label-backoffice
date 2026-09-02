import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Settings — Activity Log')
@ApiBearerAuth('accessToken')
@Controller('api/settings/activity-log')
@RequiresModule(ModuleName.SETTINGS)
@Roles(Role.OWNER_ADMIN)
export class ActivityLogController {
  constructor(private readonly activityLog: ActivityLogService) {}

  @Get()
  @ApiOperation({
    summary: 'Unified activity feed across Auth, Banking, and Catalogue — filter by date range or one source',
  })
  list(
    @CurrentUser('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('source') source?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLog.list(tenantId, dateFrom, dateTo, source, limit ? Number(limit) : undefined);
  }
}