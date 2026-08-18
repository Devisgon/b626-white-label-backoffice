import { PartialType } from '@nestjs/swagger';
import { CreateFuelTankDto } from './create-fuel-tank.dto';

export class UpdateFuelTankDto extends PartialType(CreateFuelTankDto) {}
