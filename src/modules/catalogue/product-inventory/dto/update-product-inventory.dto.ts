import { PartialType } from '@nestjs/swagger';

import { CreateProductInventoryDto } from './create-product-inventory.dto';

export class UpdateProductInventoryDto extends PartialType(
  CreateProductInventoryDto,
) {}
