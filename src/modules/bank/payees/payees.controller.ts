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
import { PayeesService } from './payees.service';
import { CreatePayeeDto } from './dto/create-payee.dto';
import { UpdatePayeeDto } from './dto/update-payee.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../auth/enums/role.enum';

@ApiTags('Payees')
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
@RequireLocation()
@Controller('bank/payees')
export class PayeesController {
  constructor(private readonly service: PayeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payee' })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreatePayeeDto) {
    return this.service.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payees (filter by status, type, search)' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['vendor', 'supplier', 'individual', 'utility', 'other'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, email, or phone',
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
  @ApiOperation({ summary: 'Get a single payee' })
  findOne(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(ctx, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payee' })
  update(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayeeDto,
  ) {
    return this.service.update(ctx, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a payee (soft delete)' })
  remove(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(ctx, id);
  }
}
