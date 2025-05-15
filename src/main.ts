import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './middleware/response.interceptor';
import { BaseExceptionFilter } from './middleware/exception.filter';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as client from 'prom-client';
import  express from 'express';

const register = new client.Registry();
const requestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const responseTimeHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const cpuUsageGauge = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percent',
});
const memoryUsageGauge = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage of the Node.js process in bytes',
});



async function bootstrap() {

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  client.collectDefaultMetrics({ register });

  register.registerMetric(requestCounter);
  register.registerMetric(responseTimeHistogram);
  register.registerMetric(cpuUsageGauge);
  register.registerMetric(memoryUsageGauge);

  server.use((req, res, next) => {
    const end = responseTimeHistogram.startTimer({ method: req.method, route: req.path });

    res.on('finish', () => {
      requestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
      end();
    });

    next();
  });

  let previousCpuUsage = process.cpuUsage();

  setInterval(() => {
    const currentCpuUsage = process.cpuUsage(previousCpuUsage);
    previousCpuUsage = process.cpuUsage();
    const userCpuSeconds = currentCpuUsage.user / 1e6;
  
    const memoryUsage = process.memoryUsage();
    memoryUsageGauge.set(memoryUsage.rss); // Resident Set Size
  
  
    cpuUsageGauge.set(userCpuSeconds);
  
  }, 5000); 
  server.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  server.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new BaseExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}



void bootstrap();
