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

import { LotterySalesService } from './lottery-sales.service';
import { CreateLotterySaleDto } from './dto/create-lottery-sale.dto';
import { UpdateLotterySaleDto } from './dto/update-lottery-sale.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Lottery Sales')
@Roles(
  Role.OWNER_ADMIN,
  Role.STORE_MANAGER,
  Role.INVENTORY_USER,
  Role.FINANCE_USER,
)
@ApiBearerAuth('accessToken')
@Controller('lottery/sales')
export class LotterySalesController {
  constructor(private readonly salesService: LotterySalesService) {}

  // ==========================
  // STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({ summary: 'Get lottery sales statistics' })
  getStats() {
    return this.salesService.getStats();
  }

  // ==========================
  // GET ALL
  // ==========================
  @Get()
  @ApiOperation({ summary: 'Get all lottery sales' })
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
    return this.salesService.findAll(
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
  @ApiOperation({ summary: 'Get lottery sales by ID' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({ summary: 'Create lottery sales' })
  create(@Body() dto: CreateLotterySaleDto) {
    return this.salesService.create(dto);
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update lottery sales' })
  update(@Param('id') id: string, @Body() dto: UpdateLotterySaleDto) {
    return this.salesService.update(Number(id), dto);
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore lottery sales' })
  restore(@Param('id') id: string) {
    return this.salesService.restore(Number(id));
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete lottery sales' })
  remove(@Param('id') id: string) {
    return this.salesService.remove(Number(id));
  }
}
