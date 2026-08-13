import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { PriceBooksService } from './price-books.service';
import { CreatePriceBookDto } from './dto/create-price-book.dto';
import { UpdatePriceBookDto } from './dto/update-price-book.dto';
import { AddPriceBookItemDto, UpdatePriceBookItemDto } from './dto/price-book-item.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../modules/auth/enums/role.enum';

@ApiTags('Price Books')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/price-books')
export class PriceBooksController {
  constructor(private readonly priceBooksService: PriceBooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all price books' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'cursor', required: false, example: 10 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, example: 'name' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.priceBooksService.findAll(
      search,
      status,
      page ? Number(page) : undefined,
      Number(limit) || 10,
      sortBy,
      order || 'asc',
      cursor ? Number(cursor) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a price book by ID, including its items' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.priceBooksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a price book' })
  @ApiResponse({ status: 409, description: 'A price book with this name already exists.' })
  create(@Body() dto: CreatePriceBookDto) {
    return this.priceBooksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a price book' })
  @ApiParam({ name: 'id', example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePriceBookDto) {
    return this.priceBooksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price book and its items' })
  @ApiParam({ name: 'id', example: 1 })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.priceBooksService.remove(id);
  }

  // ==========================
  // PRICE BOOK ITEMS
  // ==========================
  @Post(':id/items')
  @ApiOperation({ summary: 'Add a product price to a price book' })
  @ApiParam({ name: 'id', description: 'Price book ID', example: 1 })
  @ApiResponse({ status: 409, description: 'Product already has a price in this price book.' })
  addItem(@Param('id', ParseIntPipe) id: number, @Body() dto: AddPriceBookItemDto) {
    return this.priceBooksService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update a price book item' })
  @ApiParam({ name: 'id', description: 'Price book ID', example: 1 })
  @ApiParam({ name: 'itemId', description: 'Price book item ID', example: 1 })
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdatePriceBookItemDto,
  ) {
    return this.priceBooksService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove an item from a price book' })
  @ApiParam({ name: 'id', description: 'Price book ID', example: 1 })
  @ApiParam({ name: 'itemId', description: 'Price book item ID', example: 1 })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.priceBooksService.removeItem(id, itemId);
  }
}