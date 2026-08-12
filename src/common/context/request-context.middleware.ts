import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContextStorage } from './request-context.store';

/**
 * Runs before guards/interceptors/controllers for every request. Opens an
 * empty, mutable store for this request's async chain. We can't populate
 * tenantId/locationId/userId here yet — req.user doesn't exist until
 * JwtAuthGuard verifies the token — so TenantContextGuard fills in this
 * SAME object later on. Because AsyncLocalStorage keeps the same reference
 * alive for the whole chain, that later mutation is visible everywhere
 * downstream, including inside the Prisma tenant-scoping extension.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    requestContextStorage.run({}, () => next());
  }
}
