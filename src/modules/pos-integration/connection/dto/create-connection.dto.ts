import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateConnectionDto {
  @ApiPropertyOptional({
    example: 'verifone_ruby_ci',
    default: 'verifone_ruby_ci',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({ example: 'Pheonix Media' })
  @IsString()
  @IsNotEmpty()
  siteName: string;

  @ApiProperty({ example: 'SD-32' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 'DS-32' })
  @IsString()
  @IsNotEmpty()
  externalSiteId: string;

  @ApiPropertyOptional({
    example: 'file_xml',
    enum: ['file_xml', 'api', 'sftp'],
    default: 'file_xml',
  })
  @IsOptional()
  @IsIn(['file_xml', 'api', 'sftp'])
  connectionMode?: string;

  @ApiPropertyOptional({ example: '23.0' })
  @IsOptional()
  @IsString()
  commanderRelease?: string;

  @ApiPropertyOptional({ example: 'Like wise' })
  @IsOptional()
  @IsString()
  notes?: string;
}
