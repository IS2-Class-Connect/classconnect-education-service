import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Activity, Prisma, Role } from '@prisma/client';
import { AssessmentCreateDto } from 'src/dtos/assessment/assessment.create.dto';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly repository: AssessmentRepository,
    private readonly courseRepository: CourseRepository,
  ) {}

  private async getCourse(id: number) {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      logger.error(`The course with Id ${id} was not found`);
      throw new NotFoundException(`Course with ID ${id} not found.`);
    }
    return course;
  }

  private async registerActivity(
    courseId: number,
    teacherId: string,
    userId: string,
    activity: Activity,
  ) {
    if (userId != teacherId) {
      const userEnrollmentToCourse = await this.courseRepository.findEnrollment(courseId, userId);
      if (!(userEnrollmentToCourse && userEnrollmentToCourse.role == Role.ASSISTANT)) {
        // throw new ForbiddenUserException(
        //   getForbiddenExceptionMsg(courseId, userId, activity) +
        //     ' User has to be either the course head teacher or an assistant.',
        // );
      }

      const activityData: Prisma.ActivityRegisterUncheckedCreateInput = {
        courseId,
        userId,
        activity,
      };

      await this.courseRepository.createActivityRegister(activityData);
    }
  }

  async createAssess(courseId: number, createDto: AssessmentCreateDto) {
    const course = await this.getCourse(courseId);
    const { teacherId } = course;
    const { userId, ...assessmentData } = createDto;
    await this.registerActivity(
      courseId,
      teacherId,
      userId,
      createDto.type === 'Exam' ? Activity.ADD_EXAM : Activity.ADD_TASK,
    );
    const [startTime, deadline] = [createDto.startTime, createDto.deadline].map(
      (date) => new Date(date),
    );
    const assessment = { courseId, teacherId, ...assessmentData, startTime, deadline };
    return this.repository.create(assessment);
  }
}

const logger = new Logger(AssessmentService.name);
