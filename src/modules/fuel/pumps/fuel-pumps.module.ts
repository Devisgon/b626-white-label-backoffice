import { Module } from '@nestjs/common';

import { FuelPumpsController } from './fuel-pumps.controller';
import { FuelPumpsService } from './fuel-pumps.service';

@Module({
  controllers: [FuelPumpsController],
  providers: [FuelPumpsService],
  exports: [FuelPumpsService],
})
export class FuelPumpsModule {}
