import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateOperationsExpenseDto {
  @ApiProperty({
    example: 'Utilities',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    example: 'Electricity bill - August',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 12500,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    example: 'b3f1c2e0-1234-4a5b-9c6d-7e8f9a0b1c2d',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiProperty({
    example: '2026-08-19T00:00:00.000Z',
  })
  @IsDateString()
  expense_date: string;

  @ApiPropertyOptional({
    example: 'cash',
    default: 'cash',
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({
    example: 'Recorded',
    default: 'Recorded',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
