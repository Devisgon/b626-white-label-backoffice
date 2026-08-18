import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PRODUCT_SALE_TYPES = ['Retail', 'Wholesale', 'Both'] as const;
export const PRODUCT_STATUSES = ['Active', 'Inactive'] as const;

export class CreateProductDto {
  // ==========================
  // BASIC INFORMATION
  // ==========================

  @ApiProperty({ example: 'Coca Cola 500ml', description: 'Product name' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'COKE-500',
    description: 'Stock Keeping Unit, must be unique',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({
    example: 'ITEM-00123',
    description: 'Internal item code, must be unique',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  item_code?: string;

  @ApiPropertyOptional({
    example: '5901234123457',
    description: 'Barcode (EAN/UPC), must be unique',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: 'Price Look-Up code, must be unique',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  plu_code?: string;

  // ==========================
  // PRICING
  // ==========================

  @ApiPropertyOptional({ example: 1.99, description: 'Retail selling price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  retail_price?: number;

  @ApiPropertyOptional({
    example: 1.49,
    description: 'Wholesale selling price',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  wholesale_price?: number;

  @ApiPropertyOptional({ example: 1.1, description: 'Cost price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    example: 5,
    description:
      'Tax rate percentage (0-100). Defaults to department default_tax_rate when omitted.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  tax?: number;

  // ==========================
  // PRODUCT DETAILS
  // ==========================

  @ApiPropertyOptional({ example: 'Chilled soft drink, 500ml bottle' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PRODUCT_SALE_TYPES, example: 'Retail' })
  @IsOptional()
  @IsIn(PRODUCT_SALE_TYPES)
  sale_type?: string;

  @ApiPropertyOptional({ example: 'Piece' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ example: '500ml' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  // ==========================
  // MULTI-PACK / CARTON
  // ==========================

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this product is sold as a multi-pack',
  })
  @IsOptional()
  @IsBoolean()
  is_multi_pack?: boolean;

  @ApiPropertyOptional({
    example: 6,
    description:
      'Number of units per pack (required when is_multi_pack is true)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pack_size?: number;

  @ApiPropertyOptional({ example: 'Carton' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  pack_type?: string;

  // ==========================
  // RELATION IDS
  // ==========================

  @ApiPropertyOptional({ example: 1, description: 'Category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Supplier ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  supplier_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Brand ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  brand_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Department ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  department_id?: number;

  // ==========================
  // INVENTORY SETTINGS
  // ==========================

  @ApiPropertyOptional({
    example: true,
    description: 'Whether stock is tracked for this product',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  inventory_tracking?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimum_stock?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximum_stock?: number;

  // ==========================
  // STATUS
  // ==========================

  @ApiPropertyOptional({
    enum: PRODUCT_STATUSES,
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: string;
}
