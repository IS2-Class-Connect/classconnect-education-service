import { Module } from '@nestjs/common';
import { CourseModule } from './modules/course.module';
import { PrismaModule } from 'src/prisma.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsModule } from './modules/metrics.module';
import { AssessmentModule } from './modules/assessment.module';
import { env } from 'process';

const mongoUrl = env.MONGODB_URL ?? 'mongodb://cc_user:cc_password@localhost:27017';
const mongoDb = env.MONGODB_NAME ?? 'classconnect?authSource=classconnect';

@Module({
  imports: [
    PrismaModule,
    CourseModule,
    MongooseModule.forRoot(`${mongoUrl}/${mongoDb}`),
    AssessmentModule,
    MetricsModule,
  ],
})
export class AppModule {}
