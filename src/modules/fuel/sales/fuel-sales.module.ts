import { Module } from '@nestjs/common';

import { FuelSalesController } from './fuel-sales.controller';
import { FuelSalesService } from './fuel-sales.service';

@Module({
  controllers: [FuelSalesController],
  providers: [FuelSalesService],
  exports: [FuelSalesService],
})
export class FuelSalesModule {}
