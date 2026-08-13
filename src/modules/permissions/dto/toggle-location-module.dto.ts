import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { ModuleName } from '@prisma/client';

export class ToggleLocationModuleDto {
  @ApiProperty({ enum: ModuleName, example: ModuleName.BANKING })
  @IsEnum(ModuleName)
  module: ModuleName;

  @ApiProperty({ example: false, description: 'Switch this module on/off for this location' })
  @IsBoolean()
  enabled: boolean;
}