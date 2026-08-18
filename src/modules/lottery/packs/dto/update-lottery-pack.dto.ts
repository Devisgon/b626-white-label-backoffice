import { PartialType } from '@nestjs/swagger';
import { CreateLotteryPackDto } from './create-lottery-pack.dto';

export class UpdateLotteryPackDto extends PartialType(CreateLotteryPackDto) {}
