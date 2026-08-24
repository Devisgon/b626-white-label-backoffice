import { SetMetadata } from '@nestjs/common';
import { ModuleName } from '@prisma/client';

// Tags a controller (or single route) as belonging to a business module —
// e.g. @RequiresModule(ModuleName.BANKING) on BankAccountsController.
// Checked by ModulePermissionGuard, which verifies:
//   1. the caller's role/user-level permissions include this module, and
//   2. (if the caller has an active location) that location has this
//      module enabled.
// Routes with no @RequiresModule() are left alone — RolesGuard/@Roles()
// still applies to them as before. This decorator is additive, not a
// replacement for @Roles().
export const REQUIRES_MODULE_KEY = 'requiresModule';
export const RequiresModule = (module: ModuleName) =>
  SetMetadata(REQUIRES_MODULE_KEY, module);