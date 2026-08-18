import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCT_SALE_TYPES, PRODUCT_STATUSES } from './create-product.dto';

export const PRODUCT_SORT_FIELDS = [
  'id',
  'name',
  'sku',
  'item_code',
  'barcode',
  'status',
  'created_at',
  'updated_at',
] as const;

export class FindProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by Name, SKU, Item Code or Barcode',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: PRODUCT_STATUSES,
    description: 'Filter by product status',
  })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category_id?: number;

  @ApiPropertyOptional({ description: 'Filter by brand ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  brand_id?: number;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  supplier_id?: number;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  department_id?: number;

  @ApiPropertyOptional({
    enum: PRODUCT_SALE_TYPES,
    description: 'Filter by sale type',
  })
  @IsOptional()
  @IsIn(PRODUCT_SALE_TYPES)
  sale_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by inventory tracking flag (true/false)',
  })
  @IsOptional()
  @IsBooleanString()
  inventory_tracking?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Offset pagination page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Cursor pagination: last seen product ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cursor?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: PRODUCT_SORT_FIELDS,
    example: 'id',
    default: 'id',
  })
  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy?: string = 'id';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
