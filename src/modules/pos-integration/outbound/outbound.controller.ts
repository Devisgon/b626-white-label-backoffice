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
import { OutboundService } from './outbound.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';

@ApiTags('POS Integration - Outbound')
@ApiBearerAuth('accessToken')
@Controller('pos-integration/outbound')
export class OutboundController {
  constructor(private readonly service: OutboundService) {}

  @Get('readiness')
  @ApiOperation({
    summary:
      'Outbound readiness — eligible/blocked rows, required blockers, source group breakdown',
  })
  getReadiness(@Ctx() ctx: RequestContext) {
    return this.service.getReadiness(ctx);
  }

  @Post('batches')
  @ApiOperation({
    summary: 'Create an outbound batch from eligible (mapped) mappings',
  })
  createBatch(@Ctx() ctx: RequestContext, @Body() dto: CreateBatchDto) {
    return this.service.createBatch(ctx, dto);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List outbound batches' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'sent', 'failed'],
  })
  findAll(@Ctx() ctx: RequestContext, @Query('status') status?: string) {
    return this.service.findAll(ctx, status);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get a single outbound batch with its items' })
  getBatch(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getBatch(ctx, id);
  }

  @Post('batches/:id/send')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a pending batch as sent' })
  sendBatch(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.sendBatch(ctx, id);
  }
}
