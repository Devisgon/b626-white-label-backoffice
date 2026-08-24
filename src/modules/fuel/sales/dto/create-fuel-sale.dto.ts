import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateFuelSaleDto {
  @ApiProperty({
    example: 1,
    description: 'Fuel pump ID',
  })
  @IsInt()
  @Min(1)
  pump_id: number;

  @ApiProperty({
    example: 1,
    description: 'Fuel tank ID',
  })
  @IsInt()
  @Min(1)
  tank_id: number;

  @ApiProperty({
    example: 10234.5,
  })
  @IsNumber()
  @Min(0)
  opening_reading: number;

  @ApiProperty({
    example: 10334.5,
  })
  @IsNumber()
  @Min(0)
  closing_reading: number;

  @ApiProperty({
    example: 100,
  })
  @IsNumber()
  @Min(0)
  liters_sold: number;

  @ApiProperty({
    example: 272.5,
  })
  @IsNumber()
  @Min(0)
  price_per_liter: number;

  @ApiProperty({
    example: 27250,
  })
  @IsNumber()
  @Min(0)
  total_amount: number;

  @ApiPropertyOptional({
    example: 'cash',
    default: 'cash',
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({
    example: 'Morning',
  })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiProperty({
    example: '2026-08-17T14:00:00.000Z',
  })
  @IsDateString()
  sale_date: string;

  @ApiPropertyOptional({
    example: 'Completed',
    default: 'Completed',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
