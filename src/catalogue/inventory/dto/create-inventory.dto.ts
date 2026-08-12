import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({
    example: 1,
    description: 'Product ID',
  })
  @IsInt()
  @Min(1)
  product_id: number;

  @ApiProperty({
    example: 100,
  })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    example: 5,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reserved_quantity?: number;

  @ApiPropertyOptional({
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimum_stock?: number;

  @ApiPropertyOptional({
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximum_stock?: number;

  @ApiPropertyOptional({
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorder_level?: number;

  @ApiProperty({
    example: 'Main Warehouse',
  })
  @IsString()
  warehouse: string;

  @ApiPropertyOptional({
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}