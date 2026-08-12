import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { InventoryService } from './inventory.service';

import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Catalogue - Inventory')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@RequireLocation()
@ApiBearerAuth('accessToken')
@Controller('catalogue/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({
    summary: 'Create inventory record',
  })
  @ApiResponse({
    status: 201,
    description: 'Inventory created successfully',
  })
  create(
    @Body()
    createInventoryDto: CreateInventoryDto,
  ) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all inventory records',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'Warehouse',
  })
  findAll(
    @Query('page')
    page?: number,

    @Query('limit')
    limit?: number,

    @Query('search')
    search?: string,
  ) {
    return this.inventoryService.findAll(
      page ? Number(page) : 1,

      limit ? Number(limit) : 10,

      search,
    );
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Inventory statistics',
  })
  getStats() {
    return this.inventoryService.getStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get inventory by id',
  })
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update inventory',
  })
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(
      id,

      updateInventoryDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete inventory',
  })
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventoryService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore deleted inventory',
  })
  restore(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventoryService.restore(id);
  }
}
