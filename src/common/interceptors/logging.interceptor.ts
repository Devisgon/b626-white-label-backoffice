import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Structured request/response logging — separate from the default
 * pino-http access log, this logs at the application layer: which
 * controller/handler ran, for which user/tenant, and how long it took.
 * Every log line is structured JSON (not a plain string), so it can be
 * filtered/queried in a log aggregator (e.g. "show me all requests by
 * tenant X that took over 500ms").
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@InjectPinoLogger(LoggingInterceptor.name) private logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.info(
          {
            method,
            url,
            handler,
            userId: user?.id,
            tenantId: user?.tenantId,
            durationMs: Date.now() - startedAt,
            outcome: 'success',
          },
          'Request handled',
        );
      }),
      catchError((err) => {
        this.logger.warn(
          {
            method,
            url,
            handler,
            userId: user?.id,
            tenantId: user?.tenantId,
            durationMs: Date.now() - startedAt,
            outcome: 'error',
            errorMessage: err?.message,
          },
          'Request failed',
        );
        throw err;
      }),
    );
  }
}
