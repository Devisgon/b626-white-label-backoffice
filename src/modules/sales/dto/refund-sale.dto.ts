import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundSaleItemDto {
  @ApiPropertyOptional({
    example: 501,
    description: 'sale_items.id of the line being refunded.',
  })
  @IsInt()
  @IsPositive()
  sale_item_id: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Quantity to refund for this line.',
  })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class RefundSaleDto {
  @ApiPropertyOptional({
    type: [RefundSaleItemDto],
    description:
      'Specific lines/quantities to refund. Omit entirely to refund every remaining unit on the sale (full refund).',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundSaleItemDto)
  items?: RefundSaleItemDto[];

  @ApiPropertyOptional({
    example: 'Customer changed their mind',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}