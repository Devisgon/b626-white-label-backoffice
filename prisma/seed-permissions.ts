/**
 * Seeds the permission catalog (every module x action pair) and the
 * default RolePermission mapping. Safe to re-run — everything is an
 * upsert, so it never duplicates rows or wipes admin customizations made
 * afterwards through PATCH /api/permissions/users/:userId.
 *
 * Run with: npm run prisma:seed:permissions
 */
import { PrismaClient, ModuleName, PermissionAction, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Every (module, action) pair that should exist in the catalog.
const ALL_PERMISSIONS: { module: ModuleName; action: PermissionAction; description: string }[] = [
  { module: ModuleName.AUTH, action: PermissionAction.VIEW, description: 'View users, roles and permissions' },
  { module: ModuleName.AUTH, action: PermissionAction.MANAGE, description: 'Manage users, roles, permissions and locations' },
  { module: ModuleName.CATALOGUE, action: PermissionAction.VIEW, description: 'View products, categories, inventory, price books' },
  { module: ModuleName.CATALOGUE, action: PermissionAction.MANAGE, description: 'Create/update/delete products and manage stock' },
  { module: ModuleName.BANKING, action: PermissionAction.VIEW, description: 'View bank accounts, transactions, reconciliations' },
  { module: ModuleName.BANKING, action: PermissionAction.MANAGE, description: 'Create/update transactions, transfers, reconciliations' },
  { module: ModuleName.SALES, action: PermissionAction.VIEW, description: 'View sales records' },
  { module: ModuleName.SALES, action: PermissionAction.MANAGE, description: 'Create/update/void sales' },
];

// Default role -> permissions mapping. Mirrors MERGE_README's starting
// point (Banking: OWNER_ADMIN + FINANCE_USER; Catalogue: OWNER_ADMIN +
// STORE_MANAGER + INVENTORY_USER) and is editable afterwards via
// PATCH /api/permissions/users/:userId for individual users.
const ROLE_DEFAULTS: Record<Role, { module: ModuleName; action: PermissionAction }[]> = {
  [Role.OWNER_ADMIN]: [
    { module: ModuleName.AUTH, action: PermissionAction.VIEW },
    { module: ModuleName.AUTH, action: PermissionAction.MANAGE },
    { module: ModuleName.CATALOGUE, action: PermissionAction.VIEW },
    { module: ModuleName.CATALOGUE, action: PermissionAction.MANAGE },
    { module: ModuleName.BANKING, action: PermissionAction.VIEW },
    { module: ModuleName.BANKING, action: PermissionAction.MANAGE },
    { module: ModuleName.SALES, action: PermissionAction.VIEW },
    { module: ModuleName.SALES, action: PermissionAction.MANAGE },
  ],
  [Role.STORE_MANAGER]: [
    { module: ModuleName.CATALOGUE, action: PermissionAction.VIEW },
    { module: ModuleName.CATALOGUE, action: PermissionAction.MANAGE },
    { module: ModuleName.SALES, action: PermissionAction.VIEW },
    { module: ModuleName.SALES, action: PermissionAction.MANAGE },
  ],
  [Role.INVENTORY_USER]: [
    { module: ModuleName.CATALOGUE, action: PermissionAction.VIEW },
    { module: ModuleName.CATALOGUE, action: PermissionAction.MANAGE },
  ],
  [Role.FINANCE_USER]: [
    { module: ModuleName.BANKING, action: PermissionAction.VIEW },
    { module: ModuleName.BANKING, action: PermissionAction.MANAGE },
  ],
};

async function main() {
  console.log('Seeding permission catalog...');
  const permissionIds = new Map<string, string>();

  for (const p of ALL_PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      create: p,
      update: { description: p.description },
    });
    permissionIds.set(`${row.module}:${row.action}`, row.id);
  }
  console.log(`  ${ALL_PERMISSIONS.length} permissions ensured.`);

  console.log('Seeding default role permissions...');
  let count = 0;
  for (const role of Object.values(Role)) {
    for (const { module, action } of ROLE_DEFAULTS[role]) {
      const permissionId = permissionIds.get(`${module}:${action}`);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId } },
        create: { role, permissionId },
        update: {},
      });
      count++;
    }
  }
  console.log(`  ${count} role-permission links ensured.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });