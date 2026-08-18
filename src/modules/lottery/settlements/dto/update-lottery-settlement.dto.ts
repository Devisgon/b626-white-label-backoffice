import { PartialType } from '@nestjs/swagger';
import { CreateLotterySettlementDto } from './create-lottery-settlement.dto';

export class UpdateLotterySettlementDto extends PartialType(
  CreateLotterySettlementDto,
) {}
