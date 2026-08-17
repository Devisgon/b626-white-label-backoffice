import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PayType } from '@prisma/client';

export class UpsertPayrollProfileDto {
  @ApiProperty({ enum: PayType, example: PayType.HOURLY })
  @IsEnum(PayType)
  payType: PayType;

  @ApiProperty({
    example: 250,
    description: 'Hourly rate (if payType = HOURLY) or monthly salary amount (if payType = SALARY)',
  })
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiProperty({
    example: 375,
    required: false,
    description: 'Overtime hourly rate — only meaningful when payType = HOURLY (usually 1.5x baseRate)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @ApiProperty({
    required: false,
    description: 'Existing BankAccount id to use for this employee\'s direct deposit',
  })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;
}