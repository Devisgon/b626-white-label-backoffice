import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';

// Auth / tenancy
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';

// Product catalogue
import { CatalogueModule } from './catalogue/catalogue.module';

// Banking
import { BankModule } from './modules/bank/bank.module';

// Sales
import { SalesModule } from './modules/sales/sales.module';

import { RequestContextMiddleware } from './common/context/request-context.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantContextGuard } from './common/guards/tenant-context.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Structured JSON logging in production, pretty-printed in dev.
    // Never logs the Authorization header or request bodies with tokens.
    LoggerModule.forRoot({
      pinoHttp: {
        level:
          process.env.NODE_ENV === 'production'
            ? 'info'
            : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                },
              },
        redact: ['req.headers.authorization'],
        customProps: () => ({
          context: 'HTTP',
        }),
      },
    }),

    // Global rate limiting
    ThrottlerModule.forRoot([
      {
        ttl:
          Number(process.env.THROTTLE_TTL || 60) *
          1000,
        limit:
          Number(process.env.THROTTLE_LIMIT || 5),
      },
    ]),

    PrismaModule,

    AuthModule,
    UsersModule,
    LocationsModule,

    CatalogueModule,
    BankModule,
    SalesModule,
  ],

  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // Order matters:
    // JwtAuthGuard -> TenantContextGuard -> RolesGuard
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: APP_GUARD,
      useClass: TenantContextGuard,
    },
    { provide: APP_GUARD, useClass: RolesGuard },

    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes('*');
  }
}