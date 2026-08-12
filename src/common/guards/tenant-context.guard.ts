import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_LOCATION_KEY } from '../decorators/require-location.decorator';
import { requestContextStorage } from '../context/request-context.store';

/**
 * Replaces the old TenantLocationGuard, which trusted client-supplied
 * `x-tenant-id` / `x-location-id` / `x-user-id` headers — meaning anyone
 * could read or write any tenant's data just by changing a header. That is
 * exactly the "public APIs" problem: banking and catalogue routes had no
 * real access control tied to who the caller actually was.
 *
 * This guard MUST run after JwtAuthGuard (see app.module.ts provider
 * order). It trusts nothing from the client — tenantId, role and
 * activeLocationId all come from the verified JWT payload that
 * JwtStrategy attached to req.user.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.tenantId) {
      // Should not happen if JwtAuthGuard ran first and the route isn't
      // @Public(), but fail closed rather than let a request through
      // without a tenant scope.
      throw new BadRequestException('Request is missing an authenticated tenant context');
    }

    const requiresLocation = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_LOCATION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiresLocation && !user.activeLocationId) {
      throw new BadRequestException(
        'Select an active location first (POST /auth/active-location) before using this endpoint',
      );
    }

    const store = requestContextStorage.getStore();
    const ctx = {
      tenantId: user.tenantId,
      locationId: user.activeLocationId ?? null,
      userId: user.id,
      role: user.role,
    };

    if (store) {
      // Mutate the SAME object the middleware opened, so the AsyncLocalStorage
      // reference stays intact for the rest of this request's async chain.
      Object.assign(store, ctx);
    }

    // Kept for backwards compatibility with the banking module, which was
    // already written against `@Ctx() ctx: RequestContext` reading
    // `request.ctx` — no changes needed there beyond this guard.
    request.ctx = ctx;

    return true;
  }
}
