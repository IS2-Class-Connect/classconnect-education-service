import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentController } from 'src/controllers/assessment.controller';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Assessment, AssessmentSchema } from 'src/schema/assessment.schema';
import { AssessmentService } from 'src/services/assessment.service';
import { DeadlineCheckerService } from 'src/services/deadline.checker.service';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assessment.name, schema: AssessmentSchema }]),
    NotificationModule,
  ],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    DeadlineCheckerService,
    {
      provide: GoogleGenerativeAI,
      useFactory: () => {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not set');
        }
        return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      },
    },
    AssessmentRepository,
    CourseRepository,
  ],
  exports: [AssessmentService, AssessmentRepository],
})
export class AssessmentModule {}
