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

export class CreateLotteryPackDto {
  @ApiProperty({
    example: 1,
    description: 'Lottery game ID',
  })
  @IsInt()
  @Min(1)
  game_id: number;

  @ApiProperty({
    example: 'PK-000123',
  })
  @IsString()
  pack_number: string;

  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @Min(0)
  start_ticket_no: number;

  @ApiProperty({
    example: 100,
  })
  @IsInt()
  @Min(0)
  end_ticket_no: number;

  @ApiPropertyOptional({
    example: '2026-08-17T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  activated_at?: string;

  @ApiPropertyOptional({
    example: 'b3f1c2e0-1234-4a5b-9c6d-7e8f9a0b1c2d',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiPropertyOptional({
    example: 'In Stock',
    default: 'In Stock',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
