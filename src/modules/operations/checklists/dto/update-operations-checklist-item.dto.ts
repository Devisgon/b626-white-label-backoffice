import { PartialType } from '@nestjs/swagger';
import { CreateOperationsChecklistItemDto } from './create-operations-checklist-item.dto';

export class UpdateOperationsChecklistItemDto extends PartialType(
  CreateOperationsChecklistItemDto,
) {}
