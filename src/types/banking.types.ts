// Type-only definitions for the Banking module (src/modules/bank).
// DTOs live alongside each sub-module (e.g. bank-accounts/dto/) — this
// file is for plain shapes with no runtime validation.

// One entry written to BankingAuditLog by AuditLogService.log(). Every
// banking service (transactions, transfers, reconciliation, payees...)
// builds one of these after a successful write and passes it in.
export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  notes?: string;
}