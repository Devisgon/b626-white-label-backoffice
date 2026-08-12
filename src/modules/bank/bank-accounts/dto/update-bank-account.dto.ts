import { PartialType } from '@nestjs/swagger';
import { CreateBankAccountDto } from './create-bank-account.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'closed'] })
  @IsOptional()
  @IsIn(['active', 'inactive', 'closed'])
  status?: string;
}
