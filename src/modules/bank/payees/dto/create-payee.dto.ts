import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsEmail,
  IsUUID,
} from 'class-validator';

export class CreatePayeeDto {
  @ApiProperty({ example: 'Acme Supplies Inc.' })
  @IsString()
  @IsNotEmpty()
  payeeName: string;

  @ApiProperty({
    example: 'vendor',
    enum: ['vendor', 'supplier', 'individual', 'utility', 'other'],
  })
  @IsIn(['vendor', 'supplier', 'individual', 'utility', 'other'])
  payeeType: string;

  @ApiPropertyOptional({ example: 'billing@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+92 300 1234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Suite 400' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Punjab' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '54000' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Pakistan' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'NTN-1234567' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Preferred bank account ID for this payee',
  })
  @IsOptional()
  @IsUUID()
  defaultAccountId?: string;

  @ApiPropertyOptional({ example: 'Preferred vendor for fuel supply' })
  @IsOptional()
  @IsString()
  notes?: string;
}
