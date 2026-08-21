import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateReceiptSettingsDto {
  @ApiProperty({ required: false, example: 'Thank you for shopping with us!' })
  @IsOptional()
  @IsString()
  footerText?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @ApiProperty({ required: false, example: 'INV-' })
  @IsOptional()
  @IsString()
  invoicePrefix?: string;
}