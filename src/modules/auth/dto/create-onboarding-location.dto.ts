import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateOnboardingLocationDto {
  @ApiProperty({ example: 'Main Store' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Okara, Punjab', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
