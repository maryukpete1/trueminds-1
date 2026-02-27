import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Chuks Kitchen API')
    .setDescription(
      'Backend API for Chuks Kitchen Food Ordering & Customer Management System. ' +
        'Built for TrueMinds Innovations Ltd.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'User registration, login, and social authentication')
    .addTag('Foods', 'Food item management and browsing')
    .addTag('Cart', 'Shopping cart management')
    .addTag('Orders', 'Order placement and lifecycle management')
    .addTag('Ratings', 'Food and order ratings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🍽️  Chuks Kitchen API running on http://localhost:${port}`);
  logger.log(
    `📚  Swagger docs available at http://localhost:${port}/api`,
  );
}

bootstrap();
