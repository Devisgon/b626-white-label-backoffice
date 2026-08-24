import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateInboundBatchDto } from './dto/create-inbound-batch.dto';
import { ReviewInboundBatchDto } from './dto/review-inbound-batch.dto';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class InboundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService,
  ) {}

  // Simulates receiving a batch from the POS device — in this phase,
  // items are submitted manually (no live Verifone transport). The
  // batch always starts in pending_review; nothing is auto-applied.
  async createBatch(ctx: RequestContext, dto: CreateInboundBatchDto) {
    const locationId = ctx.locationId;
    if (!locationId)
      throw new BadRequestException('No active location selected.');

    const connection = await this.connectionService.findOne(ctx);

    const batch = await this.prisma.posInboundBatch.create({
      data: {
        tenantId: ctx.tenantId,
        locationId,
        posConnectionId: connection.id,
        status: 'pending_review',
        itemCount: dto.items.length,
      },
    });

    await this.connectionService.logEvent(
      ctx,
      connection.id,
      'inbound_batch_received',
      `Inbound batch received with ${dto.items.length} item(s), pending review`,
    );

    return batch;
  }

  async findAll(ctx: RequestContext, status?: string) {
    const connection = await this.connectionService.findOne(ctx);

    return this.prisma.posInboundBatch.findMany({
      where: { posConnectionId: connection.id, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatch(ctx: RequestContext, id: string) {
    const connection = await this.connectionService.findOne(ctx);
    const batch = await this.prisma.posInboundBatch.findFirst({
      where: { id, posConnectionId: connection.id },
    });
    if (!batch) throw new NotFoundException('Inbound batch not found');
    return batch;
  }

  // "Can Approve Inbound" action — a human reviewer decides whether
  // this batch's data is trustworthy enough to (eventually) apply.
  // Applying the actual changes to internal records is intentionally
  // out of scope here — this only records the review decision.
  async review(ctx: RequestContext, id: string, dto: ReviewInboundBatchDto) {
    const batch = await this.getBatch(ctx, id);

    if (batch.status !== 'pending_review') {
      throw new BadRequestException(
        `Only pending_review batches can be reviewed (current status: ${batch.status})`,
      );
    }

    const updated = await this.prisma.posInboundBatch.update({
      where: { id },
      data: {
        status: dto.decision,
        reviewedBy: ctx.userId,
        reviewedAt: new Date(),
      },
    });

    await this.connectionService.logEvent(
      ctx,
      batch.posConnectionId,
      dto.decision === 'approved'
        ? 'inbound_batch_approved'
        : 'inbound_batch_rejected',
      dto.reason ?? `Inbound batch ${dto.decision}`,
    );

    return updated;
  }
}
