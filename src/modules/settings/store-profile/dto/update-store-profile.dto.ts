import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateStoreProfileDto {
  @ApiProperty({ example: 'Pheonix Store' })
  @IsString()
  storeName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, example: 'store@pheonix.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ required: false, example: '+92 300 1234567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ required: false, example: 'Asia/Karachi' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false, example: 'PKR' })
  @IsOptional()
  @IsString()
  currency?: string;
}