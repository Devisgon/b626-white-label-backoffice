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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Transactions')
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
@RequireLocation()
@ApiBearerAuth('accessToken')
@Controller('bank/transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a draft transaction with ledger lines (must be balanced)',
  })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateTransactionDto) {
    return this.service.create(ctx, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List transactions (filter by status, account, direction, date range)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'posted', 'voided'],
  })
  @ApiQuery({ name: 'bankAccountId', required: false })
  @ApiQuery({ name: 'direction', required: false, enum: ['inflow', 'outflow'] })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'YYYY-MM-DD' })
  findAll(
    @Ctx() ctx: RequestContext,
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('bankAccountId') bankAccountId?: string,
    @Query('direction') direction?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findAll(
      ctx,
      pagination,
      status,
      bankAccountId,
      direction,
      dateFrom,
      dateTo,
    );
  }

  @Get('register/:bankAccountId')
  @ApiOperation({
    summary:
      'Bank Register — running balance and cleared status for one account',
  })
  @ApiQuery({ name: 'view', required: true, enum: ['posted', 'draft'] })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getRegister(
    @Ctx() ctx: RequestContext,
    @Param('bankAccountId') bankAccountId: string,
    @Query('view') view: 'posted' | 'draft',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getRegister(ctx, bankAccountId, view, dateFrom, dateTo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single transaction with its ledger lines' })
  findOne(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(ctx, id);
  }

  @Post(':id/post')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Post a draft transaction (affects account balance, becomes immutable)',
  })
  post(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.post(ctx, id);
  }

  @Post(':id/void')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Void a transaction (posted transactions get a paired reversal)',
  })
  void(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidTransactionDto,
  ) {
    return this.service.void(ctx, id, dto);
  }
}
