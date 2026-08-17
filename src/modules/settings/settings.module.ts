import { Module } from '@nestjs/common';
import { StoreProfileController } from './store-profile/store-profile.controller';
import { StoreProfileService } from './store-profile/store-profile.service';

// Day 1: just Store Profile. TaxModule, ReceiptModule, PaymentMethodsModule,
// NotificationsModule, SecurityModule, IntegrationsModule, ActivityLogModule
// get added here as each day's slice is built.
@Module({
  controllers: [StoreProfileController],
  providers: [StoreProfileService],
  exports: [StoreProfileService],
})
export class SettingsModule {}