import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReceiptService } from './receipt.service';
import { UpdateReceiptSettingsDto } from './dto/update-receipt-settings.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Settings — Receipt & Invoice')
@ApiBearerAuth('accessToken')
@Controller('api/settings/receipt')
@RequiresModule(ModuleName.SETTINGS)
@Roles(Role.OWNER_ADMIN)
export class ReceiptController {
  constructor(private readonly receipt: ReceiptService) {}

  @Get()
  @ApiOperation({ summary: 'Get receipt/invoice settings (footer text, logo, invoice number prefix)' })
  get(@CurrentUser('tenantId') tenantId: string) {
    return this.receipt.get(tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Update receipt/invoice settings' })
  update(@CurrentUser('tenantId') tenantId: string, @Body() dto: UpdateReceiptSettingsDto) {
    return this.receipt.update(tenantId, dto);
  }
}