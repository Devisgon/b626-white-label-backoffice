import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({
    example: 12,
    description: 'Product ID',
  })
  @IsInt()
  @IsPositive()
  product_id: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity sold',
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Flat discount amount for this line item only (subtracted after unit_price * quantity). Must not exceed the line subtotal.',
  })
  @IsOptional()
  @Min(0)
  discount?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({
    example: 'Ali Khan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  customer_name?: string;

  @ApiPropertyOptional({
    example: '03001234567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customer_phone?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Tax amount. Calculated separately from item prices.',
  })
  @IsOptional()
  @IsPositive()
  tax?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Overall sale discount.',
  })
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    example: 'cash',
    enum: ['cash', 'card', 'bank_transfer', 'mobile_wallet'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['cash', 'card', 'bank_transfer', 'mobile_wallet'])
  payment_method?: string;

  @ApiProperty({
    type: [CreateSaleItemDto],
    example: [
      {
        product_id: 12,
        quantity: 2,
      },
      {
        product_id: 18,
        quantity: 1,
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}