import { Module } from '@nestjs/common';
import { PayrollProfilesController } from './payroll-profiles/payroll-profiles.controller';
import { PayrollProfilesService } from './payroll-profiles/payroll-profiles.service';

// Day 1: just profiles. TimesheetsModule, PayRunsModule etc. get added
// here (imports + this module's own controllers/providers) as each day's
// slice is built, same pattern CatalogueModule/BankModule already use for
// their sub-features.
@Module({
  controllers: [PayrollProfilesController],
  providers: [PayrollProfilesService],
  exports: [PayrollProfilesService],
})
export class PayrollModule {}