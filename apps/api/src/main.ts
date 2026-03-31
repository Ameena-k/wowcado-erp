import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // rawBody: true is required for webhook signature verification
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Build a list of explicitly allowed origins
  const allowedOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ];

  // Always allow the FRONTEND_URL if provided (Vercel production URL)
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps, Railway health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In non-production, allow everything
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true, 
    whitelist: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(`API running on port ${process.env.PORT ?? 3001} | CORS allowed for: ${allowedOrigins.join(', ')}`);
}

bootstrap();
