import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../auth/enums/role.enum';

@ApiTags('Audit Log')
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
@RequireLocation()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly service: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary:
      'View audit history (filter by entity type, entity id, action, date range)',
  })
  findAll(@Ctx() ctx: RequestContext, @Query() query: AuditLogQueryDto) {
    return this.service.findAll(
      ctx,
      query.page ?? 1,
      query.limit ?? 20,
      query.entityType,
      query.entityId,
      query.action,
      query.dateFrom,
      query.dateTo,
    );
  }
}
