import { Module } from '@nestjs/common';
import { SendToPosController } from './send-to-pos.controller';
import { SendToPosService } from './send-to-pos.service';
import { OutboundModule } from '../pos-integration/outbound/outbound.module';

@Module({
  imports: [OutboundModule],
  controllers: [SendToPosController],
  providers: [SendToPosService],
})
export class SendToPosModule {}