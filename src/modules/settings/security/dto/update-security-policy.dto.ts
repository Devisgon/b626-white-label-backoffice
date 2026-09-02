import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSecurityPolicyDto {
  @ApiProperty({ required: false, example: 8 })
  @IsOptional()
  @IsInt()
  @Min(6)
  minPasswordLength?: number;

  @ApiProperty({ required: false, example: 60 })
  @IsOptional()
  @IsInt()
  @Min(5)
  sessionTimeoutMinutes?: number;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  require2FA?: boolean;
}