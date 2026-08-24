import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { ModuleName, PermissionAction } from '@prisma/client';

export class SetUserPermissionDto {
  @ApiProperty({ enum: ModuleName, example: ModuleName.BANKING })
  @IsEnum(ModuleName)
  module: ModuleName;

  @ApiProperty({ enum: PermissionAction, example: PermissionAction.VIEW })
  @IsEnum(PermissionAction)
  action: PermissionAction;

  @ApiProperty({
    example: true,
    description: 'true = grant this permission to the user even if their role does not include it. false = revoke it even if their role does.',
  })
  @IsBoolean()
  granted: boolean;
}