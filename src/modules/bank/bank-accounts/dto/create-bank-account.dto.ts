import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  Length,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Opening Account' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ example: 'HBL' })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({
    example: 'cash',
    enum: ['checking', 'savings', 'cash', 'credit'],
  })
  @IsIn(['checking', 'savings', 'cash', 'credit'])
  accountType: string;

  @ApiProperty({ example: '2343' })
  @IsString()
  @Length(4, 4)
  lastFour: string;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @ApiProperty({ example: '2026-03-17' })
  @IsDateString()
  openingDate: string;
}
