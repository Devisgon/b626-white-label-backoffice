import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Products')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@ApiBearerAuth('accessToken')
@Controller('catalogue/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ===========================
  // PRODUCT STATISTICS
  // ===========================
  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics (total / active / inactive)' })
  @ApiResponse({ status: 200, description: 'Statistics returned successfully.' })
  getStats() {
    return this.productsService.getStats();
  }

  // ===========================
  // CATEGORY SUMMARY
  // ===========================
  @Get('category-summary')
  @ApiOperation({ summary: 'Get product count grouped by category' })
  @ApiResponse({ status: 200, description: 'Category summary returned successfully.' })
  getCategorySummary() {
    return this.productsService.getCategorySummary();
  }

  // ===========================
  // FIND BY BARCODE
  // ===========================
  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Get a product by its barcode' })
  @ApiParam({ name: 'barcode', description: 'Product barcode' })
  @ApiResponse({ status: 200, description: 'Product found.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  // ===========================
  // PRODUCT HISTORY
  // ===========================
  @Get(':id/history')
  @ApiOperation({ summary: 'Get the audit-log history of a product' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Product history returned successfully.' })
  getProductHistory(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductHistory(id);
  }

  // ===========================
  // GET ALL PRODUCTS
  // Supports offset pagination (?page=) and cursor pagination (?cursor=)
  // ===========================
  @Get()
  @ApiOperation({ summary: 'List products with search, filters, sorting and pagination' })
  @ApiResponse({ status: 200, description: 'Products returned successfully.' })
  findAll(@Query() query: FindProductsQueryDto) {
    return this.productsService.findAll(
      query.search,
      query.status,
      query.page,
      query.limit ?? 10,
      query.sortBy ?? 'id',
      query.order ?? 'asc',
      query.cursor,
      query.category_id,
      query.brand_id,
      query.supplier_id,
      query.department_id,
      query.sale_type,
      query.inventory_tracking !== undefined
        ? query.inventory_tracking === 'true'
        : undefined,
    );
  }

  // ===========================
  // IMPORT PRODUCTS CSV
  // ===========================
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk import products from a CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CSV processed; created/errors summary returned.' })
  importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.importProducts(file);
  }

  // ===========================
  // CREATE PRODUCT
  // ===========================
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 409, description: 'SKU, Barcode, Item Code or PLU Code already exists.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // ===========================
  // GET PRODUCT BY ID
  // ===========================
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Product found.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // ===========================
  // UPDATE PRODUCT
  // ===========================
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 409, description: 'SKU, Barcode, Item Code or PLU Code already exists.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // ===========================
  // RESTORE PRODUCT
  // ===========================
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted product' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Product restored successfully.' })
  @ApiResponse({ status: 404, description: 'Deleted product not found.' })
  @ApiResponse({ status: 409, description: 'SKU, Barcode, Item Code or PLU Code already exists.' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.restore(id);
  }

  // ===========================
  // SOFT DELETE PRODUCT
  // ===========================
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}