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

import { LotteryGamesService } from './lottery-games.service';
import { CreateLotteryGameDto } from './dto/create-lottery-game.dto';
import { UpdateLotteryGameDto } from './dto/update-lottery-game.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Lottery Games')
@Roles(
  Role.OWNER_ADMIN,
  Role.STORE_MANAGER,
  Role.INVENTORY_USER,
  Role.FINANCE_USER,
)
@ApiBearerAuth('accessToken')
@Controller('lottery/games')
export class LotteryGamesController {
  constructor(private readonly gamesService: LotteryGamesService) {}

  // ==========================
  // STATISTICS
  // ==========================
  @Get('stats')
  @ApiOperation({ summary: 'Get lottery games statistics' })
  getStats() {
    return this.gamesService.getStats();
  }

  // ==========================
  // GET ALL
  // ==========================
  @Get()
  @ApiOperation({ summary: 'Get all lottery games' })
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
    return this.gamesService.findAll(
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
  @ApiOperation({ summary: 'Get lottery games by ID' })
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(Number(id));
  }

  // ==========================
  // CREATE
  // ==========================
  @Post()
  @ApiOperation({ summary: 'Create lottery games' })
  create(@Body() dto: CreateLotteryGameDto) {
    return this.gamesService.create(dto);
  }

  // ==========================
  // UPDATE
  // ==========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update lottery games' })
  update(@Param('id') id: string, @Body() dto: UpdateLotteryGameDto) {
    return this.gamesService.update(Number(id), dto);
  }

  // ==========================
  // RESTORE
  // ==========================
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore lottery games' })
  restore(@Param('id') id: string) {
    return this.gamesService.restore(Number(id));
  }

  // ==========================
  // DELETE
  // ==========================
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete lottery games' })
  remove(@Param('id') id: string) {
    return this.gamesService.remove(Number(id));
  }
}
