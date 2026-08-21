import { Module } from '@nestjs/common';

import { OperationsShiftsController } from './operations-shifts.controller';
import { OperationsShiftsService } from './operations-shifts.service';

@Module({
  controllers: [OperationsShiftsController],
  providers: [OperationsShiftsService],
  exports: [OperationsShiftsService],
})
export class OperationsShiftsModule {}
