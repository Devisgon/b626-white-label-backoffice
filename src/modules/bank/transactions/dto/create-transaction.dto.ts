import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionLineDto {
  @ApiProperty({ description: 'Chart of Accounts ID this line posts against' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ enum: ['debit', 'credit'] })
  @IsIn(['debit', 'credit'])
  lineType: string;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Fuel purchase - August' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTransactionDto {
  @ApiProperty({ enum: ['deposit', 'payment', 'adjustment'] })
  @IsIn(['deposit', 'payment', 'adjustment'])
  transactionType: string;

  @ApiProperty({ enum: ['inflow', 'outflow'] })
  @IsIn(['inflow', 'outflow'])
  direction: string;

  @ApiProperty({ example: '2026-07-28' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Bank account this transaction affects' })
  @IsUUID()
  bankAccountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  payeeId?: string;

  @ApiPropertyOptional({ example: 'INV-1029' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'August fuel supply payment' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({ example: 250.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    type: [TransactionLineDto],
    description: 'Ledger lines — debits must equal credits',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransactionLineDto)
  lines: TransactionLineDto[];
}
