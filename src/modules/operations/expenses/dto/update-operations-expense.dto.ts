import { PartialType } from '@nestjs/swagger';
import { CreateOperationsExpenseDto } from './create-operations-expense.dto';

export class UpdateOperationsExpenseDto extends PartialType(
  CreateOperationsExpenseDto,
) {}
