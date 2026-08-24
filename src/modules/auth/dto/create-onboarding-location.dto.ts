import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ModuleName } from '@prisma/client';

export class CreateOnboardingLocationDto {
  @ApiProperty({ example: 'Main Store' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Okara, Punjab', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    enum: ModuleName,
    isArray: true,
    required: false,
    example: [],
    description:
      'Modules to switch OFF for this location right away (e.g. a kiosk with no Banking). Everything else defaults to enabled — can be changed later via PATCH /api/permissions/locations/:locationId/modules.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ModuleName, { each: true })
  disabledModules?: ModuleName[];
}