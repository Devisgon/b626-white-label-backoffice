import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';

export enum OtpPurposeDto {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export class ResendOtpDto {
  @ApiProperty({ example: 'aqsa@devisgon.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: OtpPurposeDto,
    example: OtpPurposeDto.EMAIL_VERIFICATION,
  })
  @IsEnum(OtpPurposeDto)
  purpose: OtpPurposeDto;
}
