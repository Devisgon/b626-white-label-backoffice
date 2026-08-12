import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '../enums/role.enum';

export class AssignRoleDto {
  @ApiProperty({ enum: Role, example: Role.STORE_MANAGER })
  @IsEnum(Role)
  role: Role;
}
