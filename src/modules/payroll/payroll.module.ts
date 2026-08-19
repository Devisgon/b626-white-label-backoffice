import { Module } from '@nestjs/common';
import { PayrollProfilesController } from './payroll-profiles/payroll-profiles.controller';
import { PayrollProfilesService } from './payroll-profiles/payroll-profiles.service';
import { TimesheetsController } from './timesheets/timesheets.controller';
import { TimesheetsService } from './timesheets/timesheets.service';
import { PayRunsController } from './pay-runs/pay-runs.controller';
import { PayRunsService } from './pay-runs/pay-runs.service';

@Module({
  controllers: [PayrollProfilesController, TimesheetsController, PayRunsController],
  providers: [PayrollProfilesService, TimesheetsService, PayRunsService],
  exports: [PayrollProfilesService, TimesheetsService, PayRunsService],
})
export class PayrollModule {}