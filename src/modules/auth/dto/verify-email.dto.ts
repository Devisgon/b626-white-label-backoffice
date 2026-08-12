import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'aqsa@devisgon.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '482913',
    description: '6-digit code sent to the email',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
