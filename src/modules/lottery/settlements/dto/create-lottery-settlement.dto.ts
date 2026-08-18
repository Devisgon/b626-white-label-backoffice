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

export class CreateLotterySettlementDto {
  @ApiPropertyOptional({
    example: 'b3f1c2e0-1234-4a5b-9c6d-7e8f9a0b1c2d',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiProperty({
    example: '2026-08-17T23:59:00.000Z',
  })
  @IsDateString()
  settlement_date: string;

  @ApiProperty({
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  total_sales: number;

  @ApiProperty({
    example: 750,
  })
  @IsNumber()
  @Min(0)
  total_payouts: number;

  @ApiProperty({
    example: 4250,
  })
  @IsNumber()
  @Min(0)
  net_amount: number;

  @ApiPropertyOptional({
    example: 'Pending',
    default: 'Pending',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: 'End of day settlement',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
