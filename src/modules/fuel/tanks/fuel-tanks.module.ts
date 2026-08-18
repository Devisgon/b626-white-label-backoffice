import { Module } from '@nestjs/common';

import { FuelTanksController } from './fuel-tanks.controller';
import { FuelTanksService } from './fuel-tanks.service';

@Module({
  controllers: [FuelTanksController],
  providers: [FuelTanksService],
  exports: [FuelTanksService],
})
export class FuelTanksModule {}
