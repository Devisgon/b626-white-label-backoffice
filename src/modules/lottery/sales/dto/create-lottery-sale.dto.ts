import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateLotterySaleDto {
  @ApiProperty({
    example: 1,
    description: 'Lottery pack ID',
  })
  @IsInt()
  @Min(1)
  pack_id: number;

  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @Min(0)
  opening_ticket_no: number;

  @ApiProperty({
    example: 20,
  })
  @IsInt()
  @Min(0)
  closing_ticket_no: number;

  @ApiProperty({
    example: 19,
  })
  @IsInt()
  @Min(0)
  tickets_sold: number;

  @ApiProperty({
    example: 95,
  })
  @IsNumber()
  @Min(0)
  total_amount: number;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  payout_amount?: number;

  @ApiPropertyOptional({
    example: 'Evening',
  })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiProperty({
    example: '2026-08-17T18:00:00.000Z',
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
