import { PartialType } from '@nestjs/swagger';
import { CreateLotteryGameDto } from './create-lottery-game.dto';

export class UpdateLotteryGameDto extends PartialType(CreateLotteryGameDto) {}
