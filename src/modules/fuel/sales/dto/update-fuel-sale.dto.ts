import { PartialType } from '@nestjs/swagger';
import { CreateFuelSaleDto } from './create-fuel-sale.dto';

export class UpdateFuelSaleDto extends PartialType(CreateFuelSaleDto) {}
