import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Aqsa Akram' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'aqsa@devisgon.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password: string;

  // No tenantId here on purpose — a brand new user has no tenant yet.
  // The backend auto-creates one behind the scenes (see AuthService.register()).
}
