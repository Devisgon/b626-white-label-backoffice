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

import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../modules/auth/enums/role.enum';

@ApiTags('Suppliers')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  // ==========================
  // SUPPLIER STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({
    summary: 'Get supplier statistics',
  })
  getStats() {
    return this.suppliersService.getStats();
  }

  // ==========================
  // GET ALL SUPPLIERS
  // ==========================
  @Get()
  @ApiOperation({
    summary: 'Get all suppliers',
  })

  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by supplier name, email or phone',
  })

  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by supplier status',
  })

  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })

  @ApiQuery({
    name: 'cursor',
    required: false,
    example: 15,
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
    return this.suppliersService.findAll(
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
  @ApiOperation({
    summary: 'Get supplier by ID',
  })
  findOne(
    @Param('id') id: string,
  ) {
    return this.suppliersService.findOne(
      Number(id),
    );
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({
    summary: 'Create supplier',
  })
  create(
    @Body()
    createSupplierDto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(
      createSupplierDto,
    );
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({
    summary: 'Update supplier',
  })
  update(
    @Param('id') id: string,
    @Body()
    updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(
      Number(id),
      updateSupplierDto,
    );
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore supplier',
  })
  restore(
    @Param('id') id: string,
  ) {
    return this.suppliersService.restore(
      Number(id),
    );
  }

  // ==========================
  // SOFT DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete supplier',
  })
  remove(
    @Param('id') id: string,
  ) {
    return this.suppliersService.remove(
      Number(id),
    );
  }
}