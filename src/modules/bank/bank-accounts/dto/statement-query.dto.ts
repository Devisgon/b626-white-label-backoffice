import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class StatementQueryDto {
  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  dateFrom!: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  dateTo!: string;
}
