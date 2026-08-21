import { Module } from '@nestjs/common';

import { OperationsMaintenanceLogsController } from './operations-maintenance-logs.controller';
import { OperationsMaintenanceLogsService } from './operations-maintenance-logs.service';

@Module({
  controllers: [OperationsMaintenanceLogsController],
  providers: [OperationsMaintenanceLogsService],
  exports: [OperationsMaintenanceLogsService],
})
export class OperationsMaintenanceLogsModule {}
