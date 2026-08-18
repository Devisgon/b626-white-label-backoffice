import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectionService } from './connection.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';

@ApiTags('POS Integration - Connection')
@ApiBearerAuth('accessToken')
@Controller('pos-integration/connection')
export class ConnectionController {
  constructor(private readonly service: ConnectionService) {}

  @Post()
  @ApiOperation({
    summary: 'Create the POS connection profile for the active location',
  })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateConnectionDto) {
    return this.service.create(ctx, dto);
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Workspace index summary — configured connections, mapping rows, batches, recent events',
  })
  getWorkspaceSummary(@Ctx() ctx: RequestContext) {
    return this.service.getWorkspaceSummary(ctx);
  }

  @Get()
  @ApiOperation({
    summary: 'Get the POS connection profile for the active location',
  })
  findOne(@Ctx() ctx: RequestContext) {
    return this.service.findOne(ctx);
  }

  @Patch()
  @ApiOperation({ summary: 'Update connection profile, enable/disable' })
  update(@Ctx() ctx: RequestContext, @Body() dto: UpdateConnectionDto) {
    return this.service.update(ctx, dto);
  }
}
