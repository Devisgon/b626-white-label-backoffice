import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() accountCode: string;
  @ApiProperty() accountName: string;
  @ApiProperty() accountCategory: string;
  @ApiProperty() normalBalance: string;
  @ApiPropertyOptional() parentAccountId?: string;
  @ApiProperty() isSystem: boolean;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
