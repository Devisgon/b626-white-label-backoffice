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

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Categories')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  // ==========================
  // CATEGORY STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({
    summary: 'Get category statistics',
  })
  getStats() {
    return this.categoriesService.getStats();
  }

  // ==========================
  // GET ALL CATEGORIES
  // SEARCH + FILTER
  // OFFSET + CURSOR
  // ==========================
  @Get()
  @ApiOperation({
    summary: 'Get all categories',
  })

  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by category name or description',
  })

  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by category status',
  })

  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Offset pagination',
  })

  @ApiQuery({
    name: 'cursor',
    required: false,
    example: 10,
    description: 'Cursor pagination',
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
    return this.categoriesService.findAll(
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
  // GET CATEGORY BY ID
  // ==========================
  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
  })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(
      Number(id),
    );
  }

  // ==========================
  // CREATE CATEGORY
  // ==========================
  @Post()
  @ApiOperation({
    summary: 'Create category',
  })
  create(
    @Body()
    createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(
      createCategoryDto,
    );
  }

  // ==========================
  // UPDATE CATEGORY
  // ==========================
  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
  })
  update(
    @Param('id') id: string,
    @Body()
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(
      Number(id),
      updateCategoryDto,
    );
  }

  // ==========================
  // RESTORE CATEGORY
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore category',
  })
  restore(
    @Param('id') id: string,
  ) {
    return this.categoriesService.restore(
      Number(id),
    );
  }

  // ==========================
  // SOFT DELETE CATEGORY
  // ==========================
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete category',
  })
  remove(
    @Param('id') id: string,
  ) {
    return this.categoriesService.remove(
      Number(id),
    );
  }
}