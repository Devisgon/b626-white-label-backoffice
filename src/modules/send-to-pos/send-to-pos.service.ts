import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../common/interfaces/request-context.interface';
import { OutboundService } from '../pos-integration/outbound/outbound.service';
import { CreateBatchDto } from '../pos-integration/outbound/dto/create-batch.dto';

@Injectable()
export class SendToPosService {
  constructor(private readonly outboundService: OutboundService) {}

  async preview(ctx: RequestContext) {
    return this.outboundService.getReadiness(ctx);
  }

  async sendNow(ctx: RequestContext, dto: CreateBatchDto) {
    const batch = await this.outboundService.createBatch(ctx, dto);
    return this.outboundService.sendBatch(ctx, batch.id);
  }

  async history(ctx: RequestContext, status?: string) {
    return this.outboundService.findAll(ctx, status);
  }
}