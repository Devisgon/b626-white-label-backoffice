import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { VoidTransferDto } from './dto/void-transfer.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../modules/auth/enums/role.enum';

@ApiTags('Fund Transfers')
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
@RequireLocation()
@ApiBearerAuth('accessToken')
@Controller('bank/transfers')
export class TransfersController {
  constructor(private readonly service: TransfersService) {}

  @Post()
  @ApiOperation({})
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateTransferDto) {
    return this.service.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List fund transfers' })
  @ApiQuery({ name: 'status', required: false, enum: ['posted', 'voided'] })
  findAll(
    @Ctx() ctx: RequestContext,
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(ctx, pagination, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single transfer' })
  findOne(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(ctx, id);
  }

  @Post(':id/void')
  @HttpCode(200)
  @ApiOperation({ summary: 'Void a transfer (paired reversal of both sides)' })
  void(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidTransferDto,
  ) {
    return this.service.void(ctx, id, dto);
  }
}
