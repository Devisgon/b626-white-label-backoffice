import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SalesService } from './sales.service';

import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesQueryDto } from './dto/sales-query.dto';
import { RefundSaleDto } from './dto/refund-sale.dto';
import { RequireLocation } from '../../common/decorators/require-location.decorator';

@ApiTags('Sales')
@ApiBearerAuth('accessToken')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @ApiOperation({ summary: 'Create a new sale and deduct stock at the active location' })
  @Post()
  @RequireLocation()
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @ApiOperation({ summary: 'List all sales, paginated and filterable by status, payment method, or search term' })
  @Get()
  findAll(@Query() query: SalesQueryDto) {
    return this.salesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get aggregate sales statistics (totals, revenue, tax, refunds, average sale value)' })
  @Get('stats')
  getStats() {
    return this.salesService.getStats();
  }

  @ApiOperation({ summary: 'Get a single sale by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @ApiOperation({ summary: 'Get a printable receipt/invoice for a sale' })
  @Get(':id/receipt')
  getReceipt(@Param('id') id: string) {
    return this.salesService.getReceipt(id);
  }

  @ApiOperation({ summary: 'Update customer/payment details on a non-completed sale' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return this.salesService.update(id, updateSaleDto);
  }

  @ApiOperation({ summary: 'Cancel (soft-delete) a non-completed sale' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }

  @ApiOperation({ summary: 'Restore a previously cancelled sale' })
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.salesService.restore(id);
  }

  @ApiOperation({ summary: 'Refund a sale in full or partially, restocking the affected items' })
  @Post(':id/refund')
  refund(@Param('id') id: string, @Body() dto: RefundSaleDto) {
    return this.salesService.refund(id, dto);
  }
}
