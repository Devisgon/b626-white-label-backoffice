import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CartonMappingsService } from './carton-mappings.service';
import { CreateCartonMappingDto } from './dto/create-carton-mapping.dto';
import { UpdateCartonMappingDto } from './dto/update-carton-mapping.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Carton Mapping')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/carton-mappings')
export class CartonMappingsController {
  constructor(private readonly cartonMappingsService: CartonMappingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all carton mappings, optionally filtered by carton product' })
  @ApiQuery({ name: 'carton_product_id', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('carton_product_id') cartonProductId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cartonMappingsService.findAll(
      cartonProductId ? Number(cartonProductId) : undefined,
      page ? Number(page) : 1,
      Number(limit) || 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a carton mapping by ID' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cartonMappingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Map a child product into a carton/case product' })
  @ApiResponse({ status: 409, description: 'This carton/child pair is already mapped.' })
  create(@Body() dto: CreateCartonMappingDto) {
    return this.cartonMappingsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the quantity of a carton mapping' })
  @ApiParam({ name: 'id', example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCartonMappingDto) {
    return this.cartonMappingsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a carton mapping' })
  @ApiParam({ name: 'id', example: 1 })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cartonMappingsService.remove(id);
  }
}