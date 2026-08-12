import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayeeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() payeeName: string;
  @ApiProperty() payeeType: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() defaultAccountId?: string;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
