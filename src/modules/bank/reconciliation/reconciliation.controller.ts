import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service';
import { CreateReconciliationDto } from './dto/create-reconciliation.dto';
import { MatchLineDto } from './dto/match-line.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { RequireLocation } from '../../../common/decorators/require-location.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../auth/enums/role.enum';

@ApiTags('Bank Reconciliation')
@Roles(Role.OWNER_ADMIN, Role.FINANCE_USER)
@RequireLocation()
@Controller('bank/reconciliations')
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new reconciliation session for a bank account + statement period' })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateReconciliationDto) {
    return this.service.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List reconciliations' })
  @ApiQuery({ name: 'bankAccountId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['in_progress', 'completed', 'cancelled'] })
  findAll(
    @Ctx() ctx: RequestContext,
    @Query() pagination: PaginationQueryDto,
    @Query('bankAccountId') bankAccountId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(ctx, pagination, bankAccountId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reconciliation with its matched lines' })
  findOne(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(ctx, id);
  }

  @Get(':id/unmatched-transactions')
  @ApiOperation({ summary: 'List posted transactions on this account not yet matched to this reconciliation' })
  getUnmatched(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getUnmatchedTransactions(ctx, id);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Match/clear a transaction against this reconciliation' })
  matchLine(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MatchLineDto,
  ) {
    return this.service.matchLine(ctx, id, dto);
  }

  @Delete(':id/match/:transactionId')
  @ApiOperation({ summary: 'Unmatch a transaction from this reconciliation' })
  unmatchLine(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.service.unmatchLine(ctx, id, transactionId);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete the reconciliation (validates system balance matches statement)' })
  complete(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.complete(ctx, id);
  }
}