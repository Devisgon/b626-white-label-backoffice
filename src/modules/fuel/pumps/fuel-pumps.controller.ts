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

import { FuelPumpsService } from './fuel-pumps.service';
import { CreateFuelPumpDto } from './dto/create-fuel-pump.dto';
import { UpdateFuelPumpDto } from './dto/update-fuel-pump.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Fuel Pumps')
@Roles(
  Role.OWNER_ADMIN,
  Role.STORE_MANAGER,
  Role.INVENTORY_USER,
  Role.FINANCE_USER,
)
@ApiBearerAuth('accessToken')
@Controller('fuel/pumps')
export class FuelPumpsController {
  constructor(private readonly pumpsService: FuelPumpsService) {}

  // ==========================
  // STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({ summary: 'Get fuel pumps statistics' })
  getStats() {
    return this.pumpsService.getStats();
  }

  // ==========================
  // GET ALL
  // ==========================
  @Get()
  @ApiOperation({ summary: 'Get all fuel pumps' })
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
    return this.pumpsService.findAll(
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
  @ApiOperation({ summary: 'Get fuel pumps by ID' })
  findOne(@Param('id') id: string) {
    return this.pumpsService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({ summary: 'Create fuel pumps' })
  create(@Body() dto: CreateFuelPumpDto) {
    return this.pumpsService.create(dto);
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update fuel pumps' })
  update(@Param('id') id: string, @Body() dto: UpdateFuelPumpDto) {
    return this.pumpsService.update(Number(id), dto);
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore fuel pumps' })
  restore(@Param('id') id: string) {
    return this.pumpsService.restore(Number(id));
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete fuel pumps' })
  remove(@Param('id') id: string) {
    return this.pumpsService.remove(Number(id));
  }
}
