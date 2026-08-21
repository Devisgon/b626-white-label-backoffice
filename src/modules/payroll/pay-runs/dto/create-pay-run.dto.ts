import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreatePayRunDto {
  @ApiProperty({ description: 'The location this pay run covers — one location per run' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsDateString()
  periodEnd: string;
}