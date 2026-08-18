import { Module } from '@nestjs/common';
import { StoreProfileController } from './store-profile/store-profile.controller';
import { StoreProfileService } from './store-profile/store-profile.service';
import { TaxController } from './tax/tax.controller';
import { TaxService } from './tax/tax.service';

// Day 1: Store Profile. Day 2: Tax. ReceiptModule, PaymentMethodsModule,
// NotificationsModule, SecurityModule, IntegrationsModule, ActivityLogModule
// get added here as each day's slice is built.
@Module({
  controllers: [StoreProfileController, TaxController],
  providers: [StoreProfileService, TaxService],
  exports: [StoreProfileService, TaxService],
})
export class SettingsModule {}