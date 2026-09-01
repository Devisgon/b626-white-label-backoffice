import { Module } from '@nestjs/common';
import { StoreProfileController } from './store-profile/store-profile.controller';
import { StoreProfileService } from './store-profile/store-profile.service';
import { TaxController } from './tax/tax.controller';
import { TaxService } from './tax/tax.service';
import { ReceiptController } from './receipt/receipt.controller';
import { ReceiptService } from './receipt/receipt.service';
import { PaymentMethodsController } from './payment-methods/payment-methods.controller';
import { PaymentMethodsService } from './payment-methods/payment-methods.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { SecurityController } from './security/security.controller';
import { SecurityService } from './security/security.service';
import { IntegrationsController } from './integrations/integrations.controller';
import { IntegrationsService } from './integrations/integrations.service';
import { ActivityLogController } from './activity-log/activity-log.controller';
import { ActivityLogService } from './activity-log/activity-log.service';
import { ThemeController } from './theme/theme.controller';
import { ThemeService } from './theme/theme.service';

@Module({
  controllers: [
    StoreProfileController,
    TaxController,
    ReceiptController,
    PaymentMethodsController,
    NotificationsController,
    SecurityController,
    IntegrationsController,
    ActivityLogController,
    ThemeController,
  ],
  providers: [
    StoreProfileService,
    TaxService,
    ReceiptService,
    PaymentMethodsService,
    NotificationsService,
    SecurityService,
    IntegrationsService,
    ActivityLogService,
    ThemeService,
  ],
  exports: [
    StoreProfileService,
    TaxService,
    ReceiptService,
    PaymentMethodsService,
    NotificationsService,
    SecurityService,
    IntegrationsService,
    ActivityLogService,
    ThemeService,
  ],
})
export class SettingsModule {}