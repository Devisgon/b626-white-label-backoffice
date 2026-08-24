import { Module } from '@nestjs/common';

import { LotterySettlementsController } from './lottery-settlements.controller';
import { LotterySettlementsService } from './lottery-settlements.service';

@Module({
  controllers: [LotterySettlementsController],
  providers: [LotterySettlementsService],
  exports: [LotterySettlementsService],
})
export class LotterySettlementsModule {}
