import { Module } from '@nestjs/common';

import { LotterySalesController } from './lottery-sales.controller';
import { LotterySalesService } from './lottery-sales.service';

@Module({
  controllers: [LotterySalesController],
  providers: [LotterySalesService],
  exports: [LotterySalesService],
})
export class LotterySalesModule {}
