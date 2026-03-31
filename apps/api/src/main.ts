import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // rawBody: true is required for webhook signature verification
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProd && process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000', 'http://127.0.0.1:3000', '*'];
    
  app.enableCors({
    origin: isProd && !!process.env.FRONTEND_URL ? allowedOrigins : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true, 
    whitelist: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  await app.listen(process.env.PORT ?? 3001);
  console.log(`API running on http://localhost:${process.env.PORT ?? 3001}`);
}

bootstrap();
