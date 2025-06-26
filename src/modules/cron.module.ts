import { Module } from '@nestjs/common';
import { DeadlineCheckerService } from '../services/deadline.checker.service';
import { AssessmentModule } from './assessment.module';
import { NotificationModule } from './notification.module';
import { CourseModule } from './course.module';

@Module({
  imports: [AssessmentModule, NotificationModule, CourseModule],
  providers: [DeadlineCheckerService],
})
export class CronModule {}
