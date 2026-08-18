import { PartialType } from '@nestjs/swagger';
import { CreateFuelPriceDto } from './create-fuel-price.dto';

export class UpdateFuelPriceDto extends PartialType(CreateFuelPriceDto) {}
