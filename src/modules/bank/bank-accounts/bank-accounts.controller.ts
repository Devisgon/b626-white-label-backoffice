import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { StatementQueryDto } from './dto/statement-query.dto';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../modules/auth/enums/role.enum';

@ApiTags('Bank Accounts')
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
@RequireLocation()
@Controller('bank/accounts')
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bank account' })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateBankAccountDto) {
    return this.service.create(ctx, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List bank accounts (filter by status, type, search)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'closed'],
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['checking', 'savings', 'cash', 'credit'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by account name, institution, or last 4',
  })
  findAll(
    @Ctx() ctx: RequestContext,
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(ctx, pagination, status, type, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single bank account' })
  findOne(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(ctx, id);
  }

  @Get(':id/statement')
  @ApiOperation({
    summary:
      'Get account statement for a date range (opening/closing balance, transactions)',
  })
  getStatement(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.service.getStatement(ctx, id, query.dateFrom, query.dateTo);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bank account' })
  update(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.service.update(ctx, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Close a bank account (soft delete)' })
  remove(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(ctx, id);
  }
}
