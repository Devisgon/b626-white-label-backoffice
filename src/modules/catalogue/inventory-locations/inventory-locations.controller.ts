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
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { InventoryLocationsService } from './inventory-locations.service';

import { CreateInventoryLocationDto } from './dto/create-inventory-location.dto';

import { UpdateInventoryLocationDto } from './dto/update-inventory-location.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Catalogue - Inventory Locations')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/inventory-locations')
export class InventoryLocationsController {
  constructor(
    private readonly inventoryLocationsService: InventoryLocationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create inventory location',
  })
  @ApiResponse({
    status: 201,
    description: 'Inventory location created',
  })
  create(
    @Body()
    createInventoryLocationDto: CreateInventoryLocationDto,
  ) {
    return this.inventoryLocationsService.create(createInventoryLocationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all inventory locations',
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
    return this.inventoryLocationsService.findAll(
      page ? Number(page) : 1,

      limit ? Number(limit) : 10,

      search,
    );
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Inventory location statistics',
  })
  getStats() {
    return this.inventoryLocationsService.getStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get inventory location by id',
  })
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventoryLocationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update inventory location',
  })
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    updateInventoryLocationDto: UpdateInventoryLocationDto,
  ) {
    return this.inventoryLocationsService.update(
      id,

      updateInventoryLocationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete inventory location',
  })
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventoryLocationsService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore inventory location',
  })
  restore(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.inventoryLocationsService.restore(id);
  }
}
