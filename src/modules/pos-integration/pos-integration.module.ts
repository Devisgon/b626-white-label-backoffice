import { Module } from '@nestjs/common';
import { PosIntegrationController } from './pos-integration.controller';
import { PosIntegrationService } from './pos-integration.service';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [PosIntegrationController],
  providers: [PosIntegrationService],
  exports: [PosIntegrationService],
})
export class PosIntegrationModule {}
