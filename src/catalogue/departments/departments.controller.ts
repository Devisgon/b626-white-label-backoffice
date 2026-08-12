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

import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Departments')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  // ==========================
  // DEPARTMENT STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({
    summary: 'Get department statistics',
  })
  getStats() {
    return this.departmentsService.getStats();
  }

  // ==========================
  // GET ALL
  // ==========================
  @Get()
  @ApiOperation({
    summary: 'Get all departments',
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
    return this.departmentsService.findAll(
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
    summary: 'Get department by ID',
  })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({
    summary: 'Create department',
  })
  create(
    @Body()
    createDepartmentDto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(
      createDepartmentDto,
    );
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({
    summary: 'Update department',
  })
  update(
    @Param('id') id: string,
    @Body()
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(
      Number(id),
      updateDepartmentDto,
    );
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore department',
  })
  restore(@Param('id') id: string) {
    return this.departmentsService.restore(
      Number(id),
    );
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete department',
  })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(
      Number(id),
    );
  }
}