import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
const basicAuth = require('express-basic-auth');
import { AppModule } from './app.module';

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
    process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    app.use(
      ['/api-docs', '/api-docs-json'],
      basicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'changeme',
        },
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Backoffice API')
      .setDescription(
        'Merged multi-tenant backoffice API — Auth, Product Catalogue and ' +
          'Banking modules, all behind a single JWT bearer token. Every ' +
          'catalogue/banking request is scoped to the caller\'s tenant ' +
          '(and active store, where relevant) from the token — there are ' +
          'no more x-tenant-id / x-location-id headers.',
      )
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'accessToken')
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
