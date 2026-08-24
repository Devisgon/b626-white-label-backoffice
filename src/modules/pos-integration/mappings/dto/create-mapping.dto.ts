import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateMappingDto {
  @ApiProperty({
    example: 'product',
    description: 'What kind of internal record this is',
  })
  @IsString()
  @IsNotEmpty()
  internalEntityType: string;

  @ApiProperty({ example: '12', description: 'Raw internal record ID' })
  @IsString()
  @IsNotEmpty()
  internalEntityId: string;

  @ApiProperty({
    example: 'pos_item',
    description: 'The external family this row maps into',
  })
  @IsString()
  @IsNotEmpty()
  externalEntityType: string;

  @ApiProperty({
    example: 'ITEM-00231',
    description: 'Provider-facing key/code',
  })
  @IsString()
  @IsNotEmpty()
  externalEntityKey: string;

  @ApiPropertyOptional({ example: 'DEPT-05' })
  @IsOptional()
  @IsString()
  externalParentKey?: string;

  @ApiPropertyOptional({ example: 'Coca Cola 1.5L' })
  @IsOptional()
  @IsString()
  externalDisplayName?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Treat this mapping as operationally required',
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
