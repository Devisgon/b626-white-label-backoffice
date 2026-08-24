// Type-only definitions for the Permissions module (src/permissions).
// DTOs live in src/permissions/dto/ — this file is for plain shapes with
// no runtime validation.

import { ModuleName, PermissionAction } from '@prisma/client';

// One resolved (module, action) permission for a user, after merging
// their role's defaults with any per-user override. `source` tells the
// caller (e.g. an admin UI) whether it came from the role or was
// specifically granted to this one user.
export interface EffectivePermission {
  module: ModuleName;
  action: PermissionAction;
  source: 'ROLE' | 'USER_OVERRIDE';
}