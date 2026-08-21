import { PartialType } from '@nestjs/swagger';
import { CreateOperationsShiftDto } from './create-operations-shift.dto';

export class UpdateOperationsShiftDto extends PartialType(
  CreateOperationsShiftDto,
) {}
