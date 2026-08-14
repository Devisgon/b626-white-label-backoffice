/**
 * ONE-TIME REASSIGNMENT — run this once, then never again.
 *
 * WHY THIS EXISTS
 * ----------------
 * backfill-tenant-id.ts fills in NULL tenant_id/store_location_id. This
 * script is for the *different* situation: the rows already have a real
 * tenant_id/store_location_id (e.g. from a previous backfill run), but it
 * points at the WRONG tenant/location — you want to move that data to a
 * different tenant/location you actually control, instead of depending on
 * someone else's login to test with.
 *
 * USAGE
 * -----
 *   npx ts-node scripts/reassign-tenant-id.ts <fromTenantId> <toTenantId> [fromLocationId] [toLocationId]
 *
 * <fromTenantId>   required. The tenant the data currently belongs to.
 * <toTenantId>     required. The tenant you want the data moved to.
 * [fromLocationId] optional. Only rows with this store_location_id are
 *                  moved on store-scoped tables. Omit to move every
 *                  store-scoped row regardless of its current location.
 * [toLocationId]   optional. The new store_location_id to set on
 *                  store-scoped tables. Omit to leave store_location_id
 *                  untouched (only tenant_id is reassigned).
 *
 * BEFORE YOU RUN THIS
 * --------------------
 * Same caution as backfill-tenant-id.ts: take a DB backup first. This is
 * a bulk UPDATE across every tenant-scoped table, moving real rows from
 * one tenant to another.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fromTenantId = process.argv[2];
  const toTenantId = process.argv[3];
  const fromLocationId = process.argv[4];
  const toLocationId = process.argv[5];

  if (!fromTenantId || !toTenantId) {
    console.error(
      'Usage: npx ts-node scripts/reassign-tenant-id.ts <fromTenantId> <toTenantId> [fromLocationId] [toLocationId]',
    );
    process.exit(1);
  }

  const [fromTenant, toTenant] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: fromTenantId } }),
    prisma.tenant.findUnique({ where: { id: toTenantId } }),
  ]);
  if (!fromTenant) {
    console.error(`No tenant found with id "${fromTenantId}".`);
    process.exit(1);
  }
  if (!toTenant) {
    console.error(`No tenant found with id "${toTenantId}".`);
    process.exit(1);
  }

  if (toLocationId) {
    const toLocation = await prisma.location.findUnique({
      where: { id: toLocationId },
    });
    if (!toLocation) {
      console.error(`No location found with id "${toLocationId}".`);
      process.exit(1);
    }
    if (toLocation.tenantId !== toTenantId) {
      console.error(
        `Location "${toLocationId}" belongs to a different tenant than "${toTenantId}". Aborting.`,
      );
      process.exit(1);
    }
  }

  console.log(
    `Moving data: tenant "${fromTenant.name}" (${fromTenantId}) -> tenant "${toTenant.name}" (${toTenantId})`,
  );
  if (fromLocationId || toLocationId) {
    console.log(
      `  store_location_id: ${fromLocationId ?? '(any)'} -> ${toLocationId ?? '(unchanged)'}`,
    );
  }
  console.log('');

  const tenantOnlyTables = [
    'categories',
    'product_audit_logs',
    'products',
    'carton_mappings',
    'price_books',
    'price_book_items',
    'suppliers',
    'brands',
    'departments',
    'units',
    'inventory_locations',
  ] as const;

  for (const table of tenantOnlyTables) {
    const result = await (prisma as any)[table].updateMany({
      where: { tenant_id: fromTenantId },
      data: { tenant_id: toTenantId },
    });
    console.log(`  ${table.padEnd(20)} -> ${result.count} row(s) moved`);
  }

  const storeScopedTables = [
    'inventory',
    'inventory_logs',
    'product_inventory',
  ] as const;

  for (const table of storeScopedTables) {
    const where: Record<string, unknown> = { tenant_id: fromTenantId };
    if (fromLocationId) where.store_location_id = fromLocationId;

    const data: Record<string, unknown> = { tenant_id: toTenantId };
    if (toLocationId) data.store_location_id = toLocationId;

    const result = await (prisma as any)[table].updateMany({ where, data });
    console.log(`  ${table.padEnd(20)} -> ${result.count} row(s) moved`);
  }

  const saleWhere: Record<string, unknown> = { tenant_id: fromTenantId };
  if (fromLocationId) saleWhere.store_location_id = fromLocationId;
  const saleData: Record<string, unknown> = { tenant_id: toTenantId };
  if (toLocationId) saleData.store_location_id = toLocationId;

  const saleResult = await prisma.sale.updateMany({
    where: saleWhere,
    data: saleData,
  });
  console.log(`  ${'sale'.padEnd(20)} -> ${saleResult.count} row(s) moved`);

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('Reassignment failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
