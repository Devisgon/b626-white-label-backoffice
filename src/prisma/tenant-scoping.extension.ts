import { PrismaClient, Prisma } from '@prisma/client';
import { getRequestContext } from '../common/context/request-context.store';
import {
  TENANT_SCOPED_MODELS,
  READ_OPERATIONS,
  WRITE_WHERE_OPERATIONS,
  CREATE_OPERATIONS,
  CREATE_MANY_OPERATIONS,
} from './tenant-scoped-models';

/**
 * Applies automatic tenant_id / store_location_id scoping to every
 * catalogue-module query (see tenant-scoped-models.ts for the list).
 *
 * Why an extension instead of editing every catalogue service: the
 * catalogue module (~14 sub-modules) was written with no tenant concept
 * at all. Adding tenant_id to every where/data clause by hand across
 * every controller and service is exactly the kind of place a real bug
 * hides — one forgotten filter in one endpoint leaks data across
 * tenants. Doing it once, centrally, at the Prisma layer means it's
 * structurally impossible to query a catalogue model without it.
 *
 * The auth models (Tenant/User/...) and banking models are untouched —
 * banking already passes an explicit `ctx` (tenantId/locationId) into
 * every query by hand, which this extension does not interfere with.
 */
export function withTenantScoping<T extends PrismaClient>(prisma: T) {
  return prisma.$extends({
    name: 'tenant-scoping',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scoping = model ? TENANT_SCOPED_MODELS[model] : undefined;
          if (!scoping) {
            return query(args);
          }

          const ctx = getRequestContext();
          if (!ctx.tenantId) {
            // A catalogue query ran with no tenant in context: either
            // TenantContextGuard was skipped (a script/seed running
            // outside an HTTP request) or a route was wrongly marked
            // @Public(). Fail closed instead of returning unscoped,
            // cross-tenant data.
            throw new Prisma.PrismaClientKnownRequestError(
              `Tenant-scoped model "${model}" was queried with no tenant in request context`,
              { code: 'P2025', clientVersion: Prisma.prismaVersion.client },
            );
          }

          const scope: Record<string, unknown> = { tenant_id: ctx.tenantId };
          if (scoping.storeScoped && ctx.locationId) {
            scope.store_location_id = ctx.locationId;
          }

          if (
            READ_OPERATIONS.has(operation) ||
            WRITE_WHERE_OPERATIONS.has(operation)
          ) {
            (args as any).where = { ...(args as any).where, ...scope };
          } else if (operation === 'upsert') {
            (args as any).where = { ...(args as any).where, ...scope };
            (args as any).create = { ...(args as any).create, ...scope };
            (args as any).update = { ...(args as any).update, ...scope };
          } else if (CREATE_OPERATIONS.has(operation)) {
            (args as any).data = { ...(args as any).data, ...scope };
          } else if (CREATE_MANY_OPERATIONS.has(operation)) {
            const data = (args as any).data;
            (args as any).data = Array.isArray(data)
              ? data.map((row: Record<string, unknown>) => ({
                  ...row,
                  ...scope,
                }))
              : data;
          }

          return query(args);
        },
      },
    },
  });
}
