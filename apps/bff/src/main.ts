import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());

  app.enableCors({
    origin: ['http://localhost:5020', 'http://localhost:5023', 'http://localhost:5024', 'http://localhost:5022'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DXP Platform API')
    .setDescription('Digital Experience Platform — Backend for Frontend API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Health checks')
    .addTag('cms', 'Content Management')
    .addTag('storage', 'File Storage')
    .addTag('notifications', 'Notifications')
    .addTag('search', 'Search')
    .addTag('workflow', 'Workflow Orchestration')
    .addTag('rules', 'Rules Engine')
    .addTag('analytics', 'Analytics & Feature Flags')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BFF_PORT || 5021;
  await app.listen(port);
  console.log(`DXP BFF running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();

