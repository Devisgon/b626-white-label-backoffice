import { Module } from '@nestjs/common';
import { PayrollProfilesController } from './payroll-profiles/payroll-profiles.controller';
import { PayrollProfilesService } from './payroll-profiles/payroll-profiles.service';
import { TimesheetsController } from './timesheets/timesheets.controller';
import { TimesheetsService } from './timesheets/timesheets.service';

// Day 1: profiles. Day 2: timesheets. PayRunsModule, DeductionsModule,
// LeaveModule, PayslipsModule get added here as each day's slice is built,
// same pattern CatalogueModule/BankModule already use for their sub-features.
@Module({
  controllers: [PayrollProfilesController, TimesheetsController],
  providers: [PayrollProfilesService, TimesheetsService],
  exports: [PayrollProfilesService, TimesheetsService],
})
export class PayrollModule {}