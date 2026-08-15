import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: [
      'bank_account',
      'chart_of_account',
      'payee',
      'transaction',
      'fund_transfer',
      'bank_reconciliation',
    ],
  })
  @IsOptional()
  @IsIn([
    'bank_account',
    'chart_of_account',
    'payee',
    'transaction',
    'fund_transfer',
    'bank_reconciliation',
    'check_print_batch',
  ])
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter to a specific record ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    enum: [
      'created',
      'updated',
      'posted',
      'voided',
      'closed',
      'deactivated',
      'completed',
      'printed',
    ],
  })
  @IsOptional()
  @IsIn([
    'created',
    'updated',
    'posted',
    'voided',
    'closed',
    'deactivated',
    'completed',
  ])
  action?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}
