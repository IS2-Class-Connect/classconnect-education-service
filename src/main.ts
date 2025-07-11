import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './middleware/response.interceptor';
import { BaseExceptionFilter } from './middleware/exception.filter';
import { Request, Response, NextFunction } from 'express';
import {
  cpuUsageGauge,
  memoryUsageGauge,
  requestCounter,
  responseTimeHistogram,
} from './controllers/metrics.controller';

// Resource fetching for metrics
function setupMetricsFetching() {
  let prevCpuUsage = process.cpuUsage();
  let prevHrTime = process.hrtime();
  setInterval(() => {
    const currCpuUsage = process.cpuUsage(prevCpuUsage);
    const currHrTime = process.hrtime(prevHrTime);

    prevCpuUsage = process.cpuUsage();
    prevHrTime = process.hrtime();

    const elapsedHrTimeSeconds = currHrTime[0] + currHrTime[1] / 1e9;
    const totalCpuMicros = currCpuUsage.user + currCpuUsage.system;

    const cpuPercent = (totalCpuMicros / 1e6 / elapsedHrTimeSeconds) * 100;
    cpuUsageGauge.set(cpuPercent);

    const memoryUsage = process.memoryUsage();
    memoryUsageGauge.set(memoryUsage.rss);
  }, 5000);
}

// Middleware for prometheus metrics
function prometheusMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = responseTimeHistogram.startTimer();

  res.on('finish', () => {
    const routePath = req.route?.path || req.path || 'unknown';
    end({ method: req.method, route: routePath, status: res.statusCode.toString() });
    requestCounter.inc({ method: req.method, route: routePath, status: res.statusCode.toString() });
  });

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  setupMetricsFetching();
  app.use(prometheusMiddleware);
  app.useGlobalFilters(new BaseExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(process.env.PORT ?? 3002);
}

void bootstrap();
