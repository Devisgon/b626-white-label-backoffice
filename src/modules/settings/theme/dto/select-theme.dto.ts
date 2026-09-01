import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ThemeKey } from '@prisma/client';

export class SelectThemeDto {
  @ApiProperty({ enum: ThemeKey, example: ThemeKey.BLUE })
  @IsEnum(ThemeKey)
  themeKey: ThemeKey;
}