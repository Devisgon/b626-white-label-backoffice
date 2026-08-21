import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateIntegrationDto {
  @ApiProperty({ example: 'STRIPE', description: 'Name of the third-party provider' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'sk_live_xxxxxxxxxxxx', description: 'Raw API key — stored hashed, never returned again' })
  @IsString()
  @MinLength(8)
  apiKey: string;
}