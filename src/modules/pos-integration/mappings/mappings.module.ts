import { Module } from '@nestjs/common';
import { MappingsController } from './mappings.controller';
import { MappingsService } from './mappings.service';
import { ConnectionModule } from '../connection/connection.module';

@Module({
  imports: [ConnectionModule],
  controllers: [MappingsController],
  providers: [MappingsService],
  exports: [MappingsService],
})
export class MappingsModule {}
