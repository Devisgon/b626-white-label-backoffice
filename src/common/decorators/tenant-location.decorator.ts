import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../context/request-context.store';

// Reads the tenant/location/user context that TenantContextGuard derived
// from the verified JWT and attached to `request.ctx`. Unchanged from the
// original banking-module decorator — only the guard that populates
// `request.ctx` changed (it used to trust raw headers).
export const Ctx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.ctx as RequestContext;
  },
);
