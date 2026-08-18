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

import { LotteryPacksService } from './lottery-packs.service';
import { CreateLotteryPackDto } from './dto/create-lottery-pack.dto';
import { UpdateLotteryPackDto } from './dto/update-lottery-pack.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Lottery Packs')
@Roles(
  Role.OWNER_ADMIN,
  Role.STORE_MANAGER,
  Role.INVENTORY_USER,
  Role.FINANCE_USER,
)
@ApiBearerAuth('accessToken')
@Controller('lottery/packs')
export class LotteryPacksController {
  constructor(private readonly packsService: LotteryPacksService) {}

  // ==========================
  // STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({ summary: 'Get lottery packs statistics' })
  getStats() {
    return this.packsService.getStats();
  }

  // ==========================
  // GET ALL
  // ==========================
  @Get()
  @ApiOperation({ summary: 'Get all lottery packs' })
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
    return this.packsService.findAll(
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
  @ApiOperation({ summary: 'Get lottery packs by ID' })
  findOne(@Param('id') id: string) {
    return this.packsService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({ summary: 'Create lottery packs' })
  create(@Body() dto: CreateLotteryPackDto) {
    return this.packsService.create(dto);
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update lottery packs' })
  update(@Param('id') id: string, @Body() dto: UpdateLotteryPackDto) {
    return this.packsService.update(Number(id), dto);
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore lottery packs' })
  restore(@Param('id') id: string) {
    return this.packsService.restore(Number(id));
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete lottery packs' })
  remove(@Param('id') id: string) {
    return this.packsService.remove(Number(id));
  }
}
