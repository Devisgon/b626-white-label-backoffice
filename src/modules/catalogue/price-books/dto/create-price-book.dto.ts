import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const PRICE_BOOK_STATUSES = ['Active', 'Inactive'] as const;

export class CreatePriceBookDto {
  @ApiProperty({ example: 'Ramadan Promo Prices' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Special selling prices for the Ramadan campaign' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PRICE_BOOK_STATUSES, default: 'Active' })
  @IsOptional()
  @IsIn(PRICE_BOOK_STATUSES)
  status?: string;
}
