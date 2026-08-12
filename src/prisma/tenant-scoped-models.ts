/**
 * Models that belong to the product/catalogue module and must never be
 * queried or written without a tenant_id filter. Kept as an explicit
 * allow-list (rather than "everything except auth/banking") so adding a
 * new catalogue model is an opt-in decision, not something that silently
 * inherits scoping it wasn't reviewed for.
 *
 * `storeScoped: true` means the model also carries `store_location_id`
 * (the tenant's active store/branch) and should be filtered by it when an
 * active location is present in the request context. These are stock
 * records tied to a physical store; `false` means tenant-wide master data
 * (categories, brands, price books, ...) that isn't per-store.
 */
export const TENANT_SCOPED_MODELS: Record<string, { storeScoped: boolean }> = {
  categories: { storeScoped: false },
  product_audit_logs: { storeScoped: false },
  products: { storeScoped: false },
  carton_mappings: { storeScoped: false },
  price_books: { storeScoped: false },
  price_book_items: { storeScoped: false },
  suppliers: { storeScoped: false },
  brands: { storeScoped: false },
  departments: { storeScoped: false },
  units: { storeScoped: false },
  inventory_locations: { storeScoped: false },
  inventory: { storeScoped: true },
  inventory_logs: { storeScoped: true },
  product_inventory: { storeScoped: true },
  sale: { storeScoped: true },
};

export const READ_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

export const WRITE_WHERE_OPERATIONS = new Set([
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

export const CREATE_OPERATIONS = new Set(['create']);
export const CREATE_MANY_OPERATIONS = new Set(['createMany']);