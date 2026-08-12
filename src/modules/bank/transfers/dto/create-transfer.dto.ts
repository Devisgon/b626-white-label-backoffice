import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'Bank account money is moving FROM' })
  @IsUUID()
  sourceAccountId: string | undefined;

  @ApiProperty({ description: 'Bank account money is moving TO' })
  @IsUUID()
  destinationAccountId: string;

  @ApiProperty({ example: 10000.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-07-29' })
  @IsDateString()
  transferDate: string;

  @ApiPropertyOptional({
    example: 'Moving cash to petty cash for weekly float',
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description:
      'Chart of Accounts clearing account ID used for the ledger lines',
  })
  @IsUUID()
  transferClearingAccountId: string;
}
