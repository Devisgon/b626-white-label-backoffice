import { PartialType } from '@nestjs/swagger';
import { CreateLotterySaleDto } from './create-lottery-sale.dto';

export class UpdateLotterySaleDto extends PartialType(CreateLotterySaleDto) {}
