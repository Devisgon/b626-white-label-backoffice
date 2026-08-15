import { Module } from '@nestjs/common';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { PayeesModule } from './payees/payees.module';
import { ChartOfAccountsModule } from './chart-of-accounts/chart-of-accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { AuditLogModule } from './audit/audit-log.module';
import { EPrintModule } from './e-print/e-print.module';
@Module({
  imports: [
    BankAccountsModule,
    ChartOfAccountsModule,
    PayeesModule,
    TransactionsModule,
    TransfersModule,
    ReconciliationModule,
    AuditLogModule,
    EPrintModule,
  ],
})
export class BankModule {}
