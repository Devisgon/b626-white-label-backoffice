import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: '5010' })
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @ApiProperty({ example: 'Utilities Expense' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({
    example: 'expense',
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
  })
  @IsIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
  accountCategory: string;

  @ApiProperty({ example: 'debit', enum: ['debit', 'credit'] })
  @IsIn(['debit', 'credit'])
  normalBalance: string;

  @ApiPropertyOptional({
    description: 'Parent account ID for hierarchical grouping',
  })
  @IsOptional()
  @IsUUID()
  parentAccountId?: string;

  @ApiPropertyOptional({
    example: 'Electricity, gas, and water for the location',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
