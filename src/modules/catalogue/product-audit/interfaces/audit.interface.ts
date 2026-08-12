export interface ProductAuditLog {
  product_id: number;
  action: string;
  description?: string;
  old_data?: any;
  new_data?: any;
  performed_by?: string | null;
}
