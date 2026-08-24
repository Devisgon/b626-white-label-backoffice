import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestContext } from '../../types/common.types';

/**
 * Per-request context: who is calling, and which tenant/location they are
 * scoped to. Populated by TenantContextGuard right after JwtAuthGuard
 * verifies the token, then read anywhere downstream (services, the Prisma
 * tenant-scoping extension) without having to thread it through every
 * method signature.
 *
 * We store a single mutable object per request (not a new object per
 * `.run()`), because AsyncLocalStorage keeps the SAME reference alive
 * across the whole async chain for that request — the middleware opens the
 * store early (before guards run, since req.user doesn't exist yet), and
 * the guard fills it in once the JWT has been verified.
 *
 * The RequestContext shape itself lives in src/types/common.types.ts —
 * this file only holds the runtime AsyncLocalStorage instance and helpers.
 */
export type { RequestContext };

export const requestContextStorage = new AsyncLocalStorage<
  Partial<RequestContext>
>();

export function getRequestContext(): Partial<RequestContext> {
  return requestContextStorage.getStore() ?? {};
}

/**
 * Narrows `ctx.locationId` from `string | null` to `string` for use in
 * banking-module Prisma calls, where `locationId` is a required column.
 * Safe to call in any service backing a route guarded by `@RequireLocation()`
 * on the controller — TenantContextGuard already rejects the request before
 * the handler runs if `activeLocationId` is missing, so this should never
 * actually throw in practice. It exists so that guarantee is enforced (and
 * documented) at the type level too, instead of scattering non-null
 * assertions (`ctx.locationId!`) through every banking service.
 */
export function requireLocationId(
  ctx: Pick<RequestContext, 'locationId'>,
): string {
  if (!ctx.locationId) {
    throw new Error(
      'requireLocationId() called with no active location in context — ' +
        'the calling route is missing @RequireLocation()',
    );
  }
  return ctx.locationId;
}