import { Module } from '@nestjs/common';

import { FuelTanksModule } from './tanks/fuel-tanks.module';
import { FuelPumpsModule } from './pumps/fuel-pumps.module';
import { FuelPricesModule } from './prices/fuel-prices.module';
import { FuelDeliveriesModule } from './deliveries/fuel-deliveries.module';
import { FuelSalesModule } from './sales/fuel-sales.module';

@Module({
  imports: [
    FuelTanksModule,
    FuelPumpsModule,
    FuelPricesModule,
    FuelDeliveriesModule,
    FuelSalesModule,
  ],
  exports: [
    FuelTanksModule,
    FuelPumpsModule,
    FuelPricesModule,
    FuelDeliveriesModule,
    FuelSalesModule,
  ],
})
export class FuelModule {}
