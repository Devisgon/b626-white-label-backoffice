import { Module } from '@nestjs/common';

import { LotteryPacksController } from './lottery-packs.controller';
import { LotteryPacksService } from './lottery-packs.service';

@Module({
  controllers: [LotteryPacksController],
  providers: [LotteryPacksService],
  exports: [LotteryPacksService],
})
export class LotteryPacksModule {}
