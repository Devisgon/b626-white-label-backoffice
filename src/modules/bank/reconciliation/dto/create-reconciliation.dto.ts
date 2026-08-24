import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsNumber } from 'class-validator';

export class CreateReconciliationDto {
  @ApiProperty({ description: 'Bank account being reconciled' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  statementStartDate: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  statementEndDate: string;

  @ApiProperty({
    example: 115000.0,
    description: 'Ending balance shown on the bank statement',
  })
  @IsNumber()
  statementEndingBalance: number;
}
