import { Module } from '@nestjs/common';

import { OperationsShiftsModule } from './shifts/operations-shifts.module';
import { OperationsExpensesModule } from './expenses/operations-expenses.module';
import { OperationsMaintenanceLogsModule } from './maintenance-logs/operations-maintenance-logs.module';
import { OperationsChecklistsModule } from './checklists/operations-checklists.module';

@Module({
  imports: [
    OperationsShiftsModule,
    OperationsExpensesModule,
    OperationsMaintenanceLogsModule,
    OperationsChecklistsModule,
  ],
  exports: [
    OperationsShiftsModule,
    OperationsExpensesModule,
    OperationsMaintenanceLogsModule,
    OperationsChecklistsModule,
  ],
})
export class OperationsModule {}
