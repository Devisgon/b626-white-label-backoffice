import { Module } from '@nestjs/common';

import { LotteryGamesController } from './lottery-games.controller';
import { LotteryGamesService } from './lottery-games.service';

@Module({
  controllers: [LotteryGamesController],
  providers: [LotteryGamesService],
  exports: [LotteryGamesService],
})
export class LotteryGamesModule {}
