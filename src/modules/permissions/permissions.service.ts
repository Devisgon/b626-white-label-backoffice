import { Injectable, NotFoundException } from '@nestjs/common';
import { ModuleName, PermissionAction, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EffectivePermission } from '../types/permissions.types';

export interface EffectivePermission {
  module: ModuleName;
  action: PermissionAction;
  source: 'ROLE' | 'USER_OVERRIDE';
}

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // ---------- Reads ----------

  // Full permission catalog — every (module, action) pair that exists.
  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  // Default permissions a Role has out of the box.
  async getRolePermissions(role: Role) {
    const rows = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });
    return rows.map((r) => r.permission);
  }

  // Effective permissions for a specific user = role defaults, with any
  // per-user override applied on top (granted:false removes a role
  // default, granted:true adds something extra).
  async getEffectivePermissions(userId: string): Promise<EffectivePermission[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const [roleRows, overrideRows] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where: { role: user.role },
        include: { permission: true },
      }),
      this.prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true },
      }),
    ]);

    const effective = new Map<string, EffectivePermission>();
    for (const row of roleRows) {
      const key = `${row.permission.module}:${row.permission.action}`;
      effective.set(key, {
        module: row.permission.module,
        action: row.permission.action,
        source: 'ROLE',
      });
    }
    for (const row of overrideRows) {
      const key = `${row.permission.module}:${row.permission.action}`;
      if (row.granted) {
        effective.set(key, {
          module: row.permission.module,
          action: row.permission.action,
          source: 'USER_OVERRIDE',
        });
      } else {
        effective.delete(key);
      }
    }
    return Array.from(effective.values());
  }

  // Does this user have ANY permission (VIEW or MANAGE) for the module?
  // This is what ModulePermissionGuard calls on every gated request.
  async hasModuleAccess(userId: string, module: ModuleName): Promise<boolean> {
    const permissions = await this.getEffectivePermissions(userId);
    return permissions.some((p) => p.module === module);
  }

  // Is this module even switched on for the given location? Missing row
  // (e.g. a location created before this system existed) defaults to
  // enabled — the per-user permission check above is the primary gate,
  // this is a secondary "this store doesn't use X" refinement.
  async isLocationModuleEnabled(locationId: string, module: ModuleName): Promise<boolean> {
    const row = await this.prisma.locationModuleAccess.findUnique({
      where: { locationId_module: { locationId, module } },
    });
    return row ? row.enabled : true;
  }

  async getUserPermissionsDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const effective = await this.getEffectivePermissions(userId);
    return { user, effectivePermissions: effective };
  }

  async getLocationModules(locationId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new NotFoundException('Location not found');

    return this.prisma.locationModuleAccess.findMany({
      where: { locationId },
      orderBy: { module: 'asc' },
    });
  }

  // ---------- Writes (admin / OWNER_ADMIN only — enforced at controller level) ----------

  // Creates one LocationModuleAccess row per ModuleName for a freshly
  // created location. Called from AuthService.createOnboardingLocation().
  // `disabledModules` lets the creator switch a module off right away
  // (e.g. a kiosk location with no Banking) — everything else defaults on.
  async ensureLocationModules(locationId: string, disabledModules: ModuleName[] = []) {
    const disabled = new Set(disabledModules);
    await this.prisma.$transaction(
      Object.values(ModuleName).map((module) =>
        this.prisma.locationModuleAccess.upsert({
          where: { locationId_module: { locationId, module } },
          create: { locationId, module, enabled: !disabled.has(module) },
          update: {},
        }),
      ),
    );
  }

  async setLocationModule(locationId: string, module: ModuleName, enabled: boolean) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new NotFoundException('Location not found');

    return this.prisma.locationModuleAccess.upsert({
      where: { locationId_module: { locationId, module } },
      create: { locationId, module, enabled },
      update: { enabled },
    });
  }

  // Grant or revoke a single (module, action) permission for one user,
  // on top of whatever their role already gives them.
  async setUserPermission(
    targetUserId: string,
    module: ModuleName,
    action: PermissionAction,
    granted: boolean,
    grantedBy: string,
  ) {
    const [user, permission] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
      this.prisma.permission.findUnique({ where: { module_action: { module, action } } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!permission) throw new NotFoundException(`No permission exists for ${module}:${action}`);

    return this.prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: targetUserId, permissionId: permission.id } },
      create: { userId: targetUserId, permissionId: permission.id, granted, grantedBy },
      update: { granted, grantedBy },
    });
  }

  // Remove a per-user override entirely, falling back to whatever the
  // role default is.
  async clearUserPermissionOverride(targetUserId: string, module: ModuleName, action: PermissionAction) {
    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });
    if (!permission) throw new NotFoundException(`No permission exists for ${module}:${action}`);

    await this.prisma.userPermission.deleteMany({
      where: { userId: targetUserId, permissionId: permission.id },
    });
    return { message: 'Override removed — user now follows their role default for this permission.' };
  }
}