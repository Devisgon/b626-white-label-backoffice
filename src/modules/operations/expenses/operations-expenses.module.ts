import { Module } from '@nestjs/common';

import { OperationsExpensesController } from './operations-expenses.controller';
import { OperationsExpensesService } from './operations-expenses.service';

@Module({
  controllers: [OperationsExpensesController],
  providers: [OperationsExpensesService],
  exports: [OperationsExpensesService],
})
export class OperationsExpensesModule {}
