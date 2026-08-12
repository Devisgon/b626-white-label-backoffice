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

import { ApiBearerAuth } from '@nestjs/swagger';

import { SalesService } from './sales.service';

import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesQueryDto } from './dto/sales-query.dto';
import { RefundSaleDto } from './dto/refund-sale.dto';
import { RequireLocation } from '../../common/decorators/require-location.decorator';

@ApiBearerAuth('accessToken')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @RequireLocation()
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  findAll(@Query() query: SalesQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.salesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Get(':id/receipt')
  getReceipt(@Param('id') id: string) {
    return this.salesService.getReceipt(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.salesService.restore(id);
  }

  @Post(':id/refund')
  refund(@Param('id') id: string, @Body() dto: RefundSaleDto) {
    return this.salesService.refund(id, dto);
  }
}