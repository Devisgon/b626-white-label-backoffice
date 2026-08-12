import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() transactionType: string;
  @ApiProperty() direction: string;
  @ApiProperty() transactionDate: string;
  @ApiProperty() bankAccountId: string;
  @ApiPropertyOptional() payeeId?: string;
  @ApiProperty() amount: number;
  @ApiProperty() status: string;
  @ApiPropertyOptional() postedAt?: string;
  @ApiPropertyOptional() voidedAt?: string;
  @ApiProperty() createdAt: string;
}
