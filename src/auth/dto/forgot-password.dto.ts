import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'aqsa@devisgon.com' })
  @IsEmail()
  email: string;
}
