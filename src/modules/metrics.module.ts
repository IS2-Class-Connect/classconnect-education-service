import { Module } from '@nestjs/common';
import { MetricsController } from '../controllers/metrics.controller';

/**
  * Metrics module is responsible for fetching the metrics of the service
  * and returning them in a format Prometheus can use.
 */
@Module({
  controllers: [MetricsController],
})
export class MetricsModule { }
