// import { Module } from '@nestjs/common';
// import { PayrollProfilesController } from './payroll-profiles/payroll-profiles.controller';
// import { PayrollProfilesService } from './payroll-profiles/payroll-profiles.service';
// import { TimesheetsController } from './timesheets/timesheets.controller';
// import { TimesheetsService } from './timesheets/timesheets.service';
// import { PayRunsController } from './pay-runs/pay-runs.controller';
// import { PayRunsService } from './pay-runs/pay-runs.service';

// @Module({
//   controllers: [PayrollProfilesController, TimesheetsController, PayRunsController],
//   providers: [PayrollProfilesService, TimesheetsService, PayRunsService],
//   exports: [PayrollProfilesService, TimesheetsService, PayRunsService],
// })
// export class PayrollModule {}

import { Module } from '@nestjs/common';
import { PayrollProfilesController } from './payroll-profiles/payroll-profiles.controller';
import { PayrollProfilesService } from './payroll-profiles/payroll-profiles.service';
import { TimesheetsController } from './timesheets/timesheets.controller';
import { TimesheetsService } from './timesheets/timesheets.service';
import { PayRunsController } from './pay-runs/pay-runs.controller';
import { PayRunsService } from './pay-runs/pay-runs.service';
import { DeductionsController } from './deductions/deductions.controller';
import { DeductionsService } from './deductions/deductions.service';
import { LeaveRequestsController } from './leave-requests/leave-requests.controller';
import { LeaveRequestsService } from './leave-requests/leave-requests.service';
import { PayslipsController } from './payslips/payslips.controller';
import { PayslipsService } from './payslips/payslips.service';
import { PayrollReportsController } from './reports/payroll-reports.controller';
import { PayrollReportsService } from './reports/payroll-reports.service';

// Day 1: profiles. Day 2: timesheets. Day 3: pay runs. Day 4: deductions +
// leave. Day 5: payslips + reports. Payroll module is now feature-complete.
@Module({
  controllers: [
    PayrollProfilesController,
    TimesheetsController,
    PayRunsController,
    DeductionsController,
    LeaveRequestsController,
    PayslipsController,
    PayrollReportsController,
  ],
  providers: [
    PayrollProfilesService,
    TimesheetsService,
    PayRunsService,
    DeductionsService,
    LeaveRequestsService,
    PayslipsService,
    PayrollReportsService,
  ],
  exports: [
    PayrollProfilesService,
    TimesheetsService,
    PayRunsService,
    DeductionsService,
    LeaveRequestsService,
    PayslipsService,
    PayrollReportsService,
  ],
})
export class PayrollModule {}