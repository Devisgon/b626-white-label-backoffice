// Type-only definitions for the Catalogue module (src/catalogue).
// DTOs live alongside each sub-module (e.g. products/dto/) — this file is
// for plain shapes with no runtime validation.

// One entry written to product_audit_logs by ProductAuditService, e.g.
// after a stock adjustment or a product field change.
export interface ProductAuditLog {
  product_id: number;
  action: string;
  description?: string;
  old_data?: any;
  new_data?: any;
  performed_by?: string | null;
}