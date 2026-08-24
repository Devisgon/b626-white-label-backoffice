import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateLotteryGameDto {
  @ApiProperty({
    example: 'Lucky 7 Scratch',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'LG-1007',
  })
  @IsOptional()
  @IsString()
  game_number?: string;

  @ApiProperty({
    example: 5,
  })
  @IsNumber()
  @Min(0)
  ticket_price: number;

  @ApiPropertyOptional({
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  tickets_per_pack?: number;

  @ApiPropertyOptional({
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
