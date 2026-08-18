import { PartialType } from '@nestjs/swagger';
import { CreateFuelDeliveryDto } from './create-fuel-delivery.dto';

export class UpdateFuelDeliveryDto extends PartialType(CreateFuelDeliveryDto) {}
