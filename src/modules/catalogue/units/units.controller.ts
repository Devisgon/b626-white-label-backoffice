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

import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Units')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/units')
export class UnitsController {
  constructor(
    private readonly unitsService: UnitsService,
  ) {}

  // ==========================
  // UNIT STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({
    summary: 'Get unit statistics',
  })
  getStats() {
    return this.unitsService.getStats();
  }

  // ==========================
  // GET ALL UNITS
  // ==========================
  @Get()
  @ApiOperation({
    summary: 'Get all units',
  })

  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or short name',
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
    return this.unitsService.findAll(
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
    summary: 'Get unit by ID',
  })
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({
    summary: 'Create unit',
  })
  create(
    @Body()
    createUnitDto: CreateUnitDto,
  ) {
    return this.unitsService.create(createUnitDto);
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({
    summary: 'Update unit',
  })
  update(
    @Param('id') id: string,
    @Body()
    updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.update(
      Number(id),
      updateUnitDto,
    );
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore unit',
  })
  restore(@Param('id') id: string) {
    return this.unitsService.restore(Number(id));
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete unit',
  })
  remove(@Param('id') id: string) {
    return this.unitsService.remove(Number(id));
  }
}