import { PartialType } from '@nestjs/swagger';
import { CreatePriceBookDto } from './create-price-book.dto';

export class UpdatePriceBookDto extends PartialType(CreatePriceBookDto) {}
