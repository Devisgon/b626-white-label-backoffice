import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';

@ApiTags('POS Integration - Events')
@ApiBearerAuth('accessToken')
@Controller('pos-integration/events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Event counts grouped by type' })
  getSummary(@Ctx() ctx: RequestContext) {
    return this.service.getSummary(ctx);
  }

  @Get()
  @ApiOperation({
    summary: 'List events for the connection (paginated, newest first)',
  })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @Ctx() ctx: RequestContext,
    @Query('eventType') eventType?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.service.findAll(ctx, eventType, limit, offset);
  }
}
