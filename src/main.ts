import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
const basicAuth = require('express-basic-auth');
import { AppModule } from './app.module';

// Global BigInt JSON-serialization safety net.
//
// Prisma returns a native `bigint` for every BigInt-typed column — which
// is most catalogue model IDs (products, categories, brands, inventory,
// inventory_locations, product_inventory, ...). `JSON.stringify` has no
// idea how to serialize a `bigint` and throws
// "TypeError: Do not know how to serialize a BigInt" the moment a
// controller tries to send one back in a response — which crashes the
// response entirely (surfaces to the client as an opaque 500, even
// though the underlying DB write already succeeded).
//
// A couple of services (sales, products) work around this locally with
// their own `serialize()` helper, but most of the ~14 catalogue
// sub-modules return the raw Prisma object and don't. Rather than add
// (and remember to keep adding) a serializer to every single service,
// patch it once, globally, here — every response in the app becomes
// BigInt-safe. IDs here are sequential autoincrement integers, well
// under Number.MAX_SAFE_INTEGER, so converting to a plain `number` is
// safe and keeps response JSON clean (no quotes around numeric IDs).
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  // Every request body is validated against its DTO automatically —
  // invalid input never reaches a controller/service.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors();

  // ---------------------------------------------------------------------
  // Protect Swagger docs with a username/password — without this, anyone
  // who finds the URL can see every endpoint and request/response shape
  // across all three modules (auth, banking, catalogue). In production,
  // Swagger is only mounted at all if SWAGGER_ENABLED=true is explicitly
  // set — safest default is off.
  // ---------------------------------------------------------------------
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    app.use(
      ['/api-docs', '/api-docs-json'],
      basicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USER || 'admin']:
            process.env.SWAGGER_PASSWORD || 'changeme',
        },
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Backoffice API')
      .setDescription(
        'Merged multi-tenant backoffice API — Auth, Product Catalogue and ' +
          'Banking modules, all behind a single JWT bearer token. Every ' +
          "catalogue/banking request is scoped to the caller's tenant " +
          '(and active store, where relevant) from the token — there are ' +
          'no more x-tenant-id / x-location-id headers.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'accessToken',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Server running on: http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
  }
}

bootstrap();
