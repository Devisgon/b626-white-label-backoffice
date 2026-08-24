import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { CreateConnectionDto } from './create-connection.dto';

export class UpdateConnectionDto extends PartialType(CreateConnectionDto) {
  @ApiPropertyOptional({ description: 'Enable or disable this connection' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    example: 'Store closed for renovation',
    description: 'Required context if isEnabled is false',
  })
  @IsOptional()
  @IsString()
  disabledReason?: string;
}
