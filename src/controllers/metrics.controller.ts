import { Controller, Get, Res } from "@nestjs/common";
import * as client from 'prom-client';
import { Response } from 'express';

// Prometheus Initialization
const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const requestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});
register.registerMetric(requestCounter);

export const responseTimeHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});
register.registerMetric(responseTimeHistogram);

const cpuUsageGauge = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percent',
});
register.registerMetric(cpuUsageGauge);

const memoryUsageGauge = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage of the Node.js process in bytes',
});
register.registerMetric(memoryUsageGauge);

// Resource fetch
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

@Controller('education')
export class MetricsController {

  // Returns the metrics for this service.
  @Get('/metrics')
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
