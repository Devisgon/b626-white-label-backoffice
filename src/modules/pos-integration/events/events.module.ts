import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ConnectionModule } from '../connection/connection.module';

@Module({
  imports: [ConnectionModule], // ConnectionService.findOne() chahiye
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
