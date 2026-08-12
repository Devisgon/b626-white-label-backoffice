import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class AddPriceBookItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  product_id!: number;

  @ApiProperty({ example: 1.49, description: 'Selling price for this product in the price book' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  selling_price!: number;
}

export class UpdatePriceBookItemDto {
  @ApiPropertyOptional({ example: 1.29, description: 'Updated selling price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  selling_price?: number;
}
