/**
 * ONE-TIME BACKFILL — run this once, then never again.
 *
 * WHY THIS EXISTS
 * ----------------
 * Products/categories/brands/... created before tenant scoping was added
 * to this project have `tenant_id = NULL` in the database. Every
 * catalogue query now automatically filters by `tenant_id: <your real
 * tenant uuid>` (see src/prisma/tenant-scoping.extension.ts) — and in
 * SQL, `NULL = 'some-uuid'` never matches. So those old rows are
 * invisible to every endpoint (sales says "product not found" even
 * though the row is sitting right there in the table) until their
 * tenant_id is filled in.
 *
 * This script does that fill-in, once, directly with a plain
 * (non-extended) PrismaClient — bypassing the tenant-scoping extension
 * on purpose, since the whole point is to find and fix the very rows
 * that extension would otherwise hide.
 *
 * USAGE
 * -----
 *   npx ts-node scripts/backfill-tenant-id.ts <tenantId> [storeLocationId]
 *
 * <tenantId>          required. The Tenant.id (uuid) every legacy row
 *                     should belong to. If you only have one
 *                     tenant/business in this database, this is that
 *                     tenant's id (check the `tenants` table, or
 *                     Swagger -> POST /auth/login response).
 *
 * [storeLocationId]   optional. A Location.id (uuid) to also backfill
 *                     onto the STORE-SCOPED tables (inventory,
 *                     inventory_logs, product_inventory) via
 *                     `store_location_id`. Only pass this if every
 *                     legacy stock row genuinely belongs to one store —
 *                     if you have multiple stores/branches, leave this
 *                     out and set store_location_id by hand per row
 *                     instead (this script will tell you if any
 *                     store-scoped rows were left with a NULL
 *                     store_location_id).
 *
 * WHAT IT TOUCHES
 * ----------------
 * Every model listed in src/prisma/tenant-scoped-models.ts:
 *   categories, product_audit_logs, products, carton_mappings,
 *   price_books, price_book_items, suppliers, brands, departments,
 *   units, inventory_locations, inventory, inventory_logs,
 *   product_inventory, sale
 *
 * Only rows where tenant_id IS NULL are touched — rows that already
 * have a tenant_id (created normally through the API after this merge)
 * are left completely alone.
 *
 * BEFORE YOU RUN THIS
 * --------------------
 * 1. Take a DB backup / Supabase snapshot first. This is a bulk UPDATE.
 * 2. Confirm the tenantId you're passing is correct — this assigns
 *    EVERY currently-unowned row to that one tenant. Fine for
 *    single-tenant dev/test data; if you already have more than one
 *    real tenant with pre-existing catalogue data mixed together in
 *    this table, this script is not enough on its own (you'd need to
 *    split rows by hand first) — ask before running in that case.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = process.argv[2];
  const storeLocationId = process.argv[3];

  if (!tenantId) {
    console.error(
      'Usage: npx ts-node scripts/backfill-tenant-id.ts <tenantId> [storeLocationId]',
    );
    process.exit(1);
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.error(
      `No tenant found with id "${tenantId}". Check the tenants table.`,
    );
    process.exit(1);
  }

  if (storeLocationId) {
    const location = await prisma.location.findUnique({
      where: { id: storeLocationId },
    });
    if (!location) {
      console.error(
        `No location found with id "${storeLocationId}". Check the locations table.`,
      );
      process.exit(1);
    }
    if (location.tenantId !== tenantId) {
      console.error(
        `Location "${storeLocationId}" belongs to a different tenant than "${tenantId}". Aborting.`,
      );
      process.exit(1);
    }
  }

  console.log(`Backfilling tenant_id = ${tenantId} (tenant: "${tenant.name}")`);
  if (storeLocationId) {
    console.log(
      `Backfilling store_location_id = ${storeLocationId} on store-scoped tables`,
    );
  } else {
    console.log(
      'No storeLocationId passed — store-scoped tables (inventory, inventory_logs, ' +
        'product_inventory) will only get tenant_id, not store_location_id.',
    );
  }
  console.log('');

  // Tenant-only tables (master data, not per-store)
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
      where: { tenant_id: null },
      data: { tenant_id: tenantId },
    });
    console.log(`  ${table.padEnd(20)} -> ${result.count} row(s) updated`);
  }

  // Store-scoped tables (stock data, tied to a physical store/branch)
  const storeScopedTables = [
    'inventory',
    'inventory_logs',
    'product_inventory',
  ] as const;

  for (const table of storeScopedTables) {
    const data: Record<string, unknown> = { tenant_id: tenantId };
    if (storeLocationId) data.store_location_id = storeLocationId;

    const result = await (prisma as any)[table].updateMany({
      where: { tenant_id: null },
      data,
    });
    console.log(`  ${table.padEnd(20)} -> ${result.count} row(s) updated`);
  }

  // `sale` is also store-scoped, but sits in a different module (modules/sales)
  const saleResult = await prisma.sale.updateMany({
    where: { tenant_id: null },
    data: storeLocationId
      ? { tenant_id: tenantId, store_location_id: storeLocationId }
      : { tenant_id: tenantId },
  });
  console.log(`  ${'sale'.padEnd(20)} -> ${saleResult.count} row(s) updated`);

  // Sanity check: anything still NULL after this?
  console.log('\nVerifying...');
  let anyLeft = false;
  for (const table of [...tenantOnlyTables, ...storeScopedTables, 'sale']) {
    const remaining = await (prisma as any)[table].count({
      where: { tenant_id: null },
    });
    if (remaining > 0) {
      anyLeft = true;
      console.log(
        `  WARNING: ${table} still has ${remaining} row(s) with tenant_id = NULL`,
      );
    }
  }

  if (!storeLocationId) {
    for (const table of storeScopedTables) {
      const missingStore = await (prisma as any)[table].count({
        where: { tenant_id: tenantId, store_location_id: null },
      });
      if (missingStore > 0) {
        console.log(
          `  NOTE: ${table} has ${missingStore} row(s) with tenant_id set but ` +
            `store_location_id still NULL — set these by hand (per correct store) ` +
            `or re-run this script with a storeLocationId if they all belong to one store.`,
        );
      }
    }
  }

  if (!anyLeft) {
    console.log(
      '  All clear — no tenant-scoped rows left with a NULL tenant_id.',
    );
  }
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
