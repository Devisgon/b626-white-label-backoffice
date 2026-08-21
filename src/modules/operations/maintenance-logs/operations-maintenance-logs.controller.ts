import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { OperationsMaintenanceLogsService } from './operations-maintenance-logs.service';
import { CreateOperationsMaintenanceLogDto } from './dto/create-operations-maintenance-log.dto';
import { UpdateOperationsMaintenanceLogDto } from './dto/update-operations-maintenance-log.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Operations Maintenance Logs')
@Roles(
  Role.OWNER_ADMIN,
  Role.STORE_MANAGER,
  Role.INVENTORY_USER,
  Role.FINANCE_USER,
)
@ApiBearerAuth('accessToken')
@Controller('operations/maintenance-logs')
export class OperationsMaintenanceLogsController {
  constructor(
    private readonly maintenanceLogsService: OperationsMaintenanceLogsService,
  ) {}

  // ==========================
  // STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({ summary: 'Get operations maintenance logs statistics' })
  getStats() {
    return this.maintenanceLogsService.getStats();
  }

  // ==========================
  // GET ALL
  // ==========================
  @Get()
  @ApiOperation({ summary: 'Get all operations maintenance logs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'cursor', required: false, example: 10 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, example: 'id' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.maintenanceLogsService.findAll(
      search,
      status,
      page ? Number(page) : undefined,
      Number(limit) || 10,
      sortBy,
      order || 'asc',
      cursor ? Number(cursor) : undefined,
    );
  }

  // ==========================
  // GET ONE
  // ==========================
  @Get(':id')
  @ApiOperation({ summary: 'Get operations maintenance logs by ID' })
  findOne(@Param('id') id: string) {
    return this.maintenanceLogsService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({ summary: 'Create operations maintenance logs' })
  create(@Body() dto: CreateOperationsMaintenanceLogDto) {
    return this.maintenanceLogsService.create(dto);
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update operations maintenance logs' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOperationsMaintenanceLogDto,
  ) {
    return this.maintenanceLogsService.update(Number(id), dto);
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore operations maintenance logs' })
  restore(@Param('id') id: string) {
    return this.maintenanceLogsService.restore(Number(id));
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete operations maintenance logs' })
  remove(@Param('id') id: string) {
    return this.maintenanceLogsService.remove(Number(id));
  }
}
