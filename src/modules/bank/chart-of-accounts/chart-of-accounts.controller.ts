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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Chart of Accounts')
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
@RequireLocation()
@ApiBearerAuth('accessToken')
@Controller('bank/chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private readonly service: ChartOfAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chart of accounts entry' })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateAccountDto) {
    return this.service.create(ctx, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List chart of accounts (filter by status, category, search)',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by account name or code',
  })
  findAll(
    @Ctx() ctx: RequestContext,
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(ctx, pagination, status, category, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single chart of accounts entry' })
  findOne(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(ctx, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chart of accounts entry' })
  update(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.service.update(ctx, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a chart of accounts entry (soft delete)',
  })
  remove(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(ctx, id);
  }
}
