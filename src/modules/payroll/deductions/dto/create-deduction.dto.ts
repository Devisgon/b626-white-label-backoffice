import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { DeductionType } from '@prisma/client';

export class CreateDeductionDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: DeductionType, example: DeductionType.TAX })
  @IsEnum(DeductionType)
  type: DeductionType;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: true,
    description: 'true = applied to every future pay run until deactivated. false = applies once, then auto-deactivates after being used in a pay run.',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ required: false, example: 'Health insurance premium' })
  @IsOptional()
  @IsString()
  note?: string;
}