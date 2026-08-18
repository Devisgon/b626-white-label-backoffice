import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SendToPosService } from './send-to-pos.service';
import { CreateBatchDto } from '../pos-integration/outbound/dto/create-batch.dto';
import { Ctx } from '../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../common/interfaces/request-context.interface';

@ApiTags('Send to POS')
@ApiBearerAuth('accessToken')
@Controller('send-to-pos')
export class SendToPosController {
  constructor(private readonly service: SendToPosService) {}

  @Get('preview')
  @ApiOperation({ summary: 'Preview what is ready to send to POS' })
  preview(@Ctx() ctx: RequestContext) {
    return this.service.preview(ctx);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send Now — creates and immediately sends a batch to POS' })
  sendNow(@Ctx() ctx: RequestContext, @Body() dto: CreateBatchDto) {
    return this.service.sendNow(ctx, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Send history — past batches with status' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'sent'] })
  history(@Ctx() ctx: RequestContext, @Query('status') status?: string) {
    return this.service.history(ctx, status);
  }
}