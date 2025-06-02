import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './middleware/response.interceptor';
import { BaseExceptionFilter } from './middleware/exception.filter';
import { Request, Response, NextFunction } from 'express';
import { requestCounter, responseTimeHistogram } from './controllers/metrics.controller';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Middleware for prometheus metrics
  app.use((req: Request, res: Response, next: NextFunction) => {
    const end = responseTimeHistogram.startTimer();

    res.on('finish', () => {
      end({ method: req.method, route: req.path, status: res.statusCode.toString() });
      requestCounter.inc({ method: req.method, route: req.path, status: res.statusCode.toString() });
    });

    next();
  });

  app.useGlobalFilters(new BaseExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(process.env.PORT ?? 3002);
}

void bootstrap();
