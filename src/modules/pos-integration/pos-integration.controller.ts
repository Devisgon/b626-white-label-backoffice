import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PosIntegrationService } from './pos-integration.service';
import { CreatePosDeviceDto } from './dto/create-pos-device.dto';
import { UpdatePosDeviceDto } from './dto/update-pos-device.dto';
import { CreateSaleDto } from '../sales/dto/create-sale.dto';
import { Ctx } from '../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../common/interfaces/request-context.interface';

@ApiTags('POS Integration')
@ApiSecurity('tenant-id')
@ApiSecurity('location-id')
@Controller('pos-integration')
export class PosIntegrationController {
  constructor(private readonly service: PosIntegrationService) {}

  // --- Devices ---

  @Post('devices')
  @ApiOperation({ summary: 'Register a new POS device/terminal' })
  createDevice(@Ctx() ctx: RequestContext, @Body() dto: CreatePosDeviceDto) {
    return this.service.createDevice(ctx, dto);
  }

  @Get('devices')
  @ApiOperation({ summary: 'List POS devices' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['online', 'offline', 'disabled'],
  })
  findAllDevices(@Ctx() ctx: RequestContext, @Query('status') status?: string) {
    return this.service.findAllDevices(ctx, status);
  }

  @Get('devices/:id')
  @ApiOperation({ summary: 'Get a POS device' })
  findOneDevice(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOneDevice(ctx, id);
  }

  @Patch('devices/:id')
  @ApiOperation({ summary: 'Update a POS device (name or status)' })
  updateDevice(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosDeviceDto,
  ) {
    return this.service.updateDevice(ctx, id, dto);
  }

  // --- Sync Queue ---

  @Post('devices/:id/sync-queue')
  @ApiOperation({
    summary: 'Queue an entity (product/price) to be sent to this device',
  })
  @ApiBody({
    schema: {
      example: {
        entityType: 'product',
        entityId: '12',
        payload: { name: 'Coca Cola 1.5L', price: 250 },
      },
    },
  })
  queueSync(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      entityType: string;
      entityId: string;
      payload: Record<string, any>;
    },
  ) {
    return this.service.queueSync(
      ctx,
      id,
      body.entityType,
      body.entityId,
      body.payload,
    );
  }

  @Get('devices/:id/sync-queue')
  @ApiOperation({ summary: 'List pending sync items for this device' })
  getPendingSyncItems(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getPendingSyncItems(ctx, id);
  }

  @Post('devices/:id/sync-queue/mark-synced')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark queued sync items as sent' })
  @ApiBody({ schema: { example: { itemIds: ['uuid-1', 'uuid-2'] } } })
  markSynced(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { itemIds: string[] },
  ) {
    return this.service.markSynced(ctx, id, body.itemIds);
  }

  // --- Sale from device (delegates to Sales module) ---

  @Post('devices/:id/sales')
  @ApiOperation({
    summary:
      'Record a sale received from this POS device (creates it via the Sales module)',
  })
  recordSaleFromDevice(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.service.recordSaleFromDevice(ctx, id, dto);
  }
}
