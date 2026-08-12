import { ApiProperty } from '@nestjs/swagger';

export class BankAccountResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() accountName: string;
  @ApiProperty() institution: string;
  @ApiProperty() accountType: string;
  @ApiProperty() lastFour: string;
  @ApiProperty() openingBalance: number;
  @ApiProperty() currentBalance: number;
  @ApiProperty() openingDate: string;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
