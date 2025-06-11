import { Module } from '@nestjs/common';
import { CourseModule } from './modules/course.module';
import { PrismaModule } from 'src/prisma.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsModule } from './modules/metrics.module';
import { AssessmentModule } from './modules/assessment.module';

@Module({
  imports: [
    PrismaModule,
    CourseModule,
    MongooseModule.forRoot(
      'mongodb://cc_user:cc_password@localhost:27017/classconnect?authSource=classconnect',
    ),
    AssessmentModule,
    MetricsModule,
  ],
})
export class AppModule {}
