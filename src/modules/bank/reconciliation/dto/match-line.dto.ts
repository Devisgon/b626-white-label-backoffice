import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsBoolean } from 'class-validator';

export class MatchLineDto {
  @ApiProperty({ description: 'Transaction ID to mark as cleared/matched against this statement' })
  @IsUUID()
  transactionId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  cleared?: boolean;

  @ApiPropertyOptional({ example: 'Statement line ref #4521' })
  @IsOptional()
  @IsString()
  statementReference?: string;
}