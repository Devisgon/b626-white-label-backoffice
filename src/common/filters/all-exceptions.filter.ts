import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

/**
 * Centralized error handling — every exception in the app (thrown from any
 * controller/service) passes through here exactly once. This guarantees a
 * consistent error response shape across all modules (Auth, Banking, Product),
 * instead of each developer formatting errors differently.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message = isHttpException
      ? typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message || exception.message
      : 'Internal server error';

    // Structured log — never logs the raw stack to the client, only internally.
    this.logger.error(
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        err: exception,
      },
      'Unhandled exception',
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
