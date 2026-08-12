import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'aqsa@devisgon.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '482913', description: '6-digit code sent to the email' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: 'NewStrongPass123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
