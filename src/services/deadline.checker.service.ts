import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PushNotificationService } from './pushNotification.service';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Role } from '@prisma/client';

@Injectable()
export class DeadlineCheckerService {
  constructor(
    private readonly assesRepository: AssessmentRepository,
    private readonly pushNotificationService: PushNotificationService,
    private readonly courseRepository: CourseRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkDeadlines() {
    const now = new Date();
    const timeFrame = new Date(now.getTime() + 60 * 70 * 1000); // +1:10h

    // Get only courses that are open
    const courses = await this.courseRepository.findCourses({
      page: 1,
      limit: 10,
      startDateLt: now.toISOString(),
      endDateGt: now.toISOString(),
    });

    courses.forEach(async (course) => {
      // Get all students enrolled in the course
      const enrollments = await this.courseRepository.findEnrollments({
        role: Role.STUDENT,
        courseId: course.id,
      });
      // Get all upcoming assessments for the course
      const upcomingAssessments = await this.assesRepository.findAssessments({
        deadlineBegin: now.toISOString(),
        deadlineEnd: timeFrame.toISOString(),
        courseId: course.id,
      });

      // For each student, notify about the upcoming assessment
      enrollments.forEach(async (enrollment) => {
        upcomingAssessments.forEach(async (assessment) => {
          if (!assessment.submissions || !assessment.submissions[enrollment.userId]) {
            this.pushNotificationService.notifyDeadlineReminder(
              enrollment.userId,
              'Upcoming deadline',
              `The assignment "${assessment.title}" is due soon.`,
            );
          }
        });
      });
    });

    logger.log(`All deadlines checked at ${now.toISOString()}.`);
  }
}

const logger = new Logger(DeadlineCheckerService.name);
