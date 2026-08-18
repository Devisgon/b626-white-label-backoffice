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

import { FuelSalesService } from './fuel-sales.service';
import { CreateFuelSaleDto } from './dto/create-fuel-sale.dto';
import { UpdateFuelSaleDto } from './dto/update-fuel-sale.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Fuel Sales')
@Roles(
  Role.OWNER_ADMIN,
  Role.STORE_MANAGER,
  Role.INVENTORY_USER,
  Role.FINANCE_USER,
)
@ApiBearerAuth('accessToken')
@Controller('fuel/sales')
export class FuelSalesController {
  constructor(private readonly salesService: FuelSalesService) {}

  // ==========================
  // STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({ summary: 'Get fuel sales statistics' })
  getStats() {
    return this.salesService.getStats();
  }

  // ==========================
  // GET ALL
  // ==========================
  @Get()
  @ApiOperation({ summary: 'Get all fuel sales' })
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
  @ApiOperation({ summary: 'Get fuel sales by ID' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({ summary: 'Create fuel sales' })
  create(@Body() dto: CreateFuelSaleDto) {
    return this.salesService.create(dto);
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update fuel sales' })
  update(@Param('id') id: string, @Body() dto: UpdateFuelSaleDto) {
    return this.salesService.update(Number(id), dto);
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore fuel sales' })
  restore(@Param('id') id: string) {
    return this.salesService.restore(Number(id));
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete fuel sales' })
  remove(@Param('id') id: string) {
    return this.salesService.remove(Number(id));
  }
}
