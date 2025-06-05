import { Module } from '@nestjs/common';
import { CourseModule } from './modules/course.module';
import { PrismaModule } from 'src/prisma.module';
import { MetricsModule } from './modules/metrics.module';

@Module({
  imports: [PrismaModule, CourseModule, MetricsModule],
})
export class AppModule { }
