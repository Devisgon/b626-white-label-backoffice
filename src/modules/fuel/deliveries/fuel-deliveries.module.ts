import { Module } from '@nestjs/common';

import { FuelDeliveriesController } from './fuel-deliveries.controller';
import { FuelDeliveriesService } from './fuel-deliveries.service';

@Module({
  controllers: [FuelDeliveriesController],
  providers: [FuelDeliveriesService],
  exports: [FuelDeliveriesService],
})
export class FuelDeliveriesModule {}
