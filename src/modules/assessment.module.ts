import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentController } from 'src/controllers/assessment.controller';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Assessment, AssessmentSchema } from 'src/schema/assessment.schema';
import { AssessmentService } from 'src/services/assessment.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Assessment.name, schema: AssessmentSchema }])],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    // TODO: Add AI provider
    AssessmentRepository,
    CourseRepository,
  ],
  exports: [AssessmentService, AssessmentRepository],
})
export class AssessmentModule {}
