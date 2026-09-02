// Type-only definitions shared across modules (src/common). No runtime
// validation lives here — just the plain shape. The AsyncLocalStorage
// instance and helper functions that operate on this shape stay in
// src/common/context/request-context.store.ts, since they're runtime
// logic, not a type.

// Per-request context: who is calling, and which tenant/location they are
// scoped to. Populated by TenantContextGuard right after JwtAuthGuard
// verifies the token, then read anywhere downstream (services, the Prisma
// tenant-scoping extension) without having to thread it through every
// method signature.
export interface RequestContext {
  tenantId: string;
  locationId: string | null;
  userId: string;
  role: string;
}