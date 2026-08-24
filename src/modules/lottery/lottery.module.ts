import { Module } from '@nestjs/common';

import { LotteryGamesModule } from './games/lottery-games.module';
import { LotteryPacksModule } from './packs/lottery-packs.module';
import { LotterySalesModule } from './sales/lottery-sales.module';
import { LotterySettlementsModule } from './settlements/lottery-settlements.module';

@Module({
  imports: [
    LotteryGamesModule,
    LotteryPacksModule,
    LotterySalesModule,
    LotterySettlementsModule,
  ],
  exports: [
    LotteryGamesModule,
    LotteryPacksModule,
    LotterySalesModule,
    LotterySettlementsModule,
  ],
})
export class LotteryModule {}
