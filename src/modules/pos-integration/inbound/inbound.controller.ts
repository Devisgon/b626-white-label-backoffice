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
import { InboundService } from './inbound.service';
import { CreateInboundBatchDto } from './dto/create-inbound-batch.dto';
import { ReviewInboundBatchDto } from './dto/review-inbound-batch.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';

@ApiTags('POS Integration - Inbound')
@ApiBearerAuth('accessToken')
@Controller('pos-integration/inbound')
export class InboundController {
  constructor(private readonly service: InboundService) {}

  @Post('batches')
  @ApiOperation({
    summary:
      'Record an inbound batch received from the POS device (pending review)',
  })
  createBatch(@Ctx() ctx: RequestContext, @Body() dto: CreateInboundBatchDto) {
    return this.service.createBatch(ctx, dto);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List inbound batches' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending_review', 'approved', 'rejected'],
  })
  findAll(@Ctx() ctx: RequestContext, @Query('status') status?: string) {
    return this.service.findAll(ctx, status);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get a single inbound batch' })
  getBatch(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getBatch(ctx, id);
  }

  @Post('batches/:id/review')
  @HttpCode(200)
  @ApiOperation({ summary: 'Approve or reject a pending inbound batch' })
  review(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewInboundBatchDto,
  ) {
    return this.service.review(ctx, id, dto);
  }
}
