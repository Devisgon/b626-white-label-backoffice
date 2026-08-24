import { PartialType } from '@nestjs/swagger';
import { CreateOperationsMaintenanceLogDto } from './create-operations-maintenance-log.dto';

export class UpdateOperationsMaintenanceLogDto extends PartialType(
  CreateOperationsMaintenanceLogDto,
) {}
