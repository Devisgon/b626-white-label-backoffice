import { Body, Controller, Get, Param, ParseEnumPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { PaymentMethodsService } from './payment-methods.service';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { RequiresModule } from '../../../common/decorators/requires-module.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../auth/enums/role.enum';
import { ModuleName } from '@prisma/client';

@ApiTags('Settings — Payment Methods')
@ApiBearerAuth('accessToken')
@Controller('api/settings/payment-methods')
@RequiresModule(ModuleName.SETTINGS)
@Roles(Role.OWNER_ADMIN)
export class PaymentMethodsController {
  constructor(private readonly paymentMethods: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'List which payment methods are enabled for your store (CASH, CARD, WALLET, BANK_TRANSFER)' })
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.paymentMethods.list(tenantId);
  }

  @Patch(':method')
  @ApiOperation({ summary: 'Enable or disable one payment method' })
  setEnabled(
    @CurrentUser('tenantId') tenantId: string,
    @Param('method', new ParseEnumPipe(PaymentMethod)) method: PaymentMethod,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethods.setEnabled(tenantId, method, dto.isEnabled);
  }
}