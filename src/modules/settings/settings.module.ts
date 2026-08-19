import { Module } from '@nestjs/common';
import { StoreProfileController } from './store-profile/store-profile.controller';
import { StoreProfileService } from './store-profile/store-profile.service';
import { TaxController } from './tax/tax.controller';
import { TaxService } from './tax/tax.service';
import { ReceiptController } from './receipt/receipt.controller';
import { ReceiptService } from './receipt/receipt.service';
import { PaymentMethodsController } from './payment-methods/payment-methods.controller';
import { PaymentMethodsService } from './payment-methods/payment-methods.service';

@Module({
  controllers: [StoreProfileController, TaxController, ReceiptController, PaymentMethodsController],
  providers: [StoreProfileService, TaxService, ReceiptService, PaymentMethodsService],
  exports: [StoreProfileService, TaxService, ReceiptService, PaymentMethodsService],
})
export class SettingsModule {}