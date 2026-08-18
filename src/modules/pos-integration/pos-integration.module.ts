import { Module } from '@nestjs/common';
import { ConnectionModule } from './connection/connection.module';
import { MappingsModule } from './mappings/mappings.module';
import { OutboundModule } from './outbound/outbound.module';
import { InboundModule } from './inbound/inbound.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConnectionModule,
    MappingsModule,
    OutboundModule,
    InboundModule,
    EventsModule,
  ],
})
export class PosIntegrationModule {}
