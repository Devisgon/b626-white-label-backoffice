import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_MODULE_KEY } from '../decorators/requires-module.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PermissionsService } from '../../modules/permissions/permissions.service';

/**
 * Enforces database-driven module access, on top of JwtAuthGuard (who are
 * you) and RolesGuard (does your role allow this route). Must run AFTER
 * both of those — see provider order in app.module.ts.
 *
 * A route only gets checked if it (or its controller) is tagged with
 * @RequiresModule(ModuleName.X). Two things both have to be true:
 *   1. The user's effective permissions (role defaults + per-user
 *      overrides) include this module.
 *   2. If the user has an active location selected, that location must
 *      have this module enabled (LocationModuleAccess).
 */
@Injectable()
export class ModulePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredModule = this.reflector.getAllAndOverride<string>(REQUIRES_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Route isn't tagged with @RequiresModule() — nothing to check here.
    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) {
      // JwtAuthGuard should have already rejected this — fail closed.
      throw new ForbiddenException('Not authenticated');
    }

    const hasAccess = await this.permissions.hasModuleAccess(user.id, requiredModule as any);
    if (!hasAccess) {
      throw new ForbiddenException(
        `Your role/account does not have access to the ${requiredModule} module`,
      );
    }

    if (user.activeLocationId) {
      const locationEnabled = await this.permissions.isLocationModuleEnabled(
        user.activeLocationId,
        requiredModule as any,
      );
      if (!locationEnabled) {
        throw new ForbiddenException(
          `The ${requiredModule} module is disabled for your currently selected location`,
        );
      }
    }

    return true;
  }
}
