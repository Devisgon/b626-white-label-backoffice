import { Module } from '@nestjs/common';
import { EPrintController } from './e-print.controller';
import { EPrintService } from './e-print.service';

@Module({
  controllers: [EPrintController],
  providers: [EPrintService],
})
export class EPrintModule {}
