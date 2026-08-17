import { Module } from '@nestjs/common';

import { InventoryLocationsController } from './inventory-locations.controller';
import { InventoryLocationsService } from './inventory-locations.service';

@Module({
  controllers: [InventoryLocationsController],
  providers: [InventoryLocationsService],
  exports: [InventoryLocationsService],
})
export class InventoryLocationsModule {}