import { Module } from '@nestjs/common';
import { ConnectionModule } from './connection/connection.module';
import { MappingsModule } from './mappings/mappings.module';

@Module({
  imports: [ConnectionModule, MappingsModule],
})
export class PosIntegrationModule {}
