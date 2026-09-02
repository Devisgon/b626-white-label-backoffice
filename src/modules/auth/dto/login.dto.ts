import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'mahnoor.saleem@devisgon.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  password: string;

  @ApiProperty({
    example: '123456',
    required: false,
    description: 'Required only if MFA is enabled on the account',
  })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}