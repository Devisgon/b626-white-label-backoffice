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

import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Brands')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // ==========================
  // BRAND STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({
    summary: 'Get brand statistics',
  })
  getStats() {
    return this.brandsService.getStats();
  }

  // ==========================
  // GET ALL BRANDS
  // ==========================
  @Get()
  @ApiOperation({
    summary: 'Get all brands',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'name',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
  })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.brandsService.findAll(
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
  // GET BRAND
  // ==========================
  @Get(':id')
  @ApiOperation({
    summary: 'Get brand by ID',
  })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(Number(id));
  }

  // ==========================
  // CREATE BRAND
  // ==========================
  @Post()
  @ApiOperation({
    summary: 'Create brand',
  })
  create(
    @Body()
    createBrandDto: CreateBrandDto,
  ) {
    return this.brandsService.create(createBrandDto);
  }

  // ==========================
  // UPDATE BRAND
  // ==========================
  @Patch(':id')
  @ApiOperation({
    summary: 'Update brand',
  })
  update(
    @Param('id') id: string,
    @Body()
    updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.update(Number(id), updateBrandDto);
  }

  // ==========================
  // RESTORE BRAND
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore brand',
  })
  restore(@Param('id') id: string) {
    return this.brandsService.restore(Number(id));
  }

  // ==========================
  // DELETE BRAND
  // ==========================
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete brand',
  })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(Number(id));
  }
}
