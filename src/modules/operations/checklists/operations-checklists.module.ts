import { Module } from '@nestjs/common';

import { OperationsChecklistsController } from './operations-checklists.controller';
import { OperationsChecklistsService } from './operations-checklists.service';

@Module({
  controllers: [OperationsChecklistsController],
  providers: [OperationsChecklistsService],
  exports: [OperationsChecklistsService],
})
export class OperationsChecklistsModule {}
