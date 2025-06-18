import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Activity, Prisma, Role } from '@prisma/client';
import { AssessmentCreateDto } from 'src/dtos/assessment/assessment.create.dto';
import { AssessmentFilterDto } from 'src/dtos/assessment/assessment.filter.dto';
import { AssessmentResponseDto } from 'src/dtos/assessment/assessment.response.dto';
import { AssessmentUpdateDto } from 'src/dtos/assessment/assessment.update.dto';
import { AssessmentPerformanceDto } from 'src/dtos/course/course.assessmentPerformance.dto';
import { CoursePerformanceDto } from 'src/dtos/course/course.performance.dto';
import { StudentPerformanceInCourseDto } from 'src/dtos/course/course.studentPerformance.dto';
import { ForbiddenUserException } from 'src/exceptions/exception.forbidden.user';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Assessment, AssessmentType } from 'src/schema/assessment.schema';
import { getForbiddenExceptionMsg } from 'src/utils';

function getAssessResponse(assess: Assessment): AssessmentResponseDto {
  // TODO: Transform it to AssessmentResponseDto when schema completed
  return { ...assess };
}

function validateAssessment(assessment: AssessmentCreateDto) {
  const { startTime, deadline } = assessment;
  if (new Date(startTime) >= new Date(deadline)) {
    throw new BadRequestException('Start time must be before the deadline.');
  }
}

function validateAssessmentUpdate(updateData: AssessmentUpdateDto, assessment: Assessment) {
  const { startTime, deadline } = updateData;
  const now = new Date();

  if (deadline && new Date(deadline) <= now) {
    throw new BadRequestException('Deadline must be a future date.');
  }

  if (startTime && deadline && new Date(startTime) >= new Date(deadline)) {
    throw new BadRequestException('Start time must be before the deadline.');
  }

  if (
    startTime &&
    (new Date(startTime) >= now || (!deadline && new Date(startTime) >= assessment.deadline))
  ) {
    // TODO: change msg
    throw new BadRequestException('Start time must be a future date.');
  }
}

@Injectable()
export class AssessmentService {
  constructor(
    private readonly repository: AssessmentRepository,
    private readonly courseRepository: CourseRepository,
  ) { }

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
        throw new ForbiddenUserException(
          getForbiddenExceptionMsg(courseId, userId, activity) +
          ' User has to be either the course head teacher or an assistant.',
        );
      }

      const activityData: Prisma.ActivityRegisterUncheckedCreateInput = {
        courseId,
        userId,
        activity,
      };

      await this.courseRepository.createActivityRegister(activityData);
    }
  }

  private async getAssess(id: string) {
    const assessment = await this.repository.findById(id);
    if (!assessment) {
      logger.error(`The assesment with ID ${id} was not found`);
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }
    return assessment;
  }

  async createAssess(courseId: number, createDto: AssessmentCreateDto) {
    validateAssessment(createDto);

    const course = await this.getCourse(courseId);
    const { teacherId } = course;
    const { userId, ...assessmentData } = createDto;

    await this.registerActivity(
      courseId,
      teacherId,
      userId,
      createDto.type === AssessmentType.Exam ? Activity.ADD_EXAM : Activity.ADD_TASK,
    );

    const [startTime, deadline] = [createDto.startTime, createDto.deadline].map(
      (date) => new Date(date),
    );
    const assessment = { courseId, userId, teacherId, ...assessmentData, startTime, deadline };

    return getAssessResponse(await this.repository.create(assessment));
  }

  async findAssess(id: string) {
    return getAssessResponse(await this.getAssess(id));
  }

  async getAssessments(filter: AssessmentFilterDto) {
    return (await this.repository.findAssessments(filter)).map((assessment) =>
      getAssessResponse(assessment),
    );
  }

  async findAssessmentsByCourse(courseId: number) {
    return (await this.repository.findByCourseId(courseId)).map((assessment) =>
      getAssessResponse(assessment),
    );
  }

  async updateAssess(id: string, updateDto: AssessmentUpdateDto) {
    const assessment = await this.getAssess(id);

    validateAssessmentUpdate(updateDto, assessment);

    const { courseId, teacherId, type } = assessment;
    const { userId, ...updateData } = updateDto;

    await this.registerActivity(
      courseId,
      teacherId,
      userId,
      type === AssessmentType.Exam ? Activity.EDIT_EXAM : Activity.EDIT_TASK,
    );

    const updateAssess = {
      ...updateData,
      startTime: updateDto.startTime ? new Date(updateDto.startTime) : undefined,
      deadline: updateDto.deadline ? new Date(updateDto.deadline) : undefined,
    };

    const updatedAssessment = await this.repository.update(id, updateAssess);
    return updatedAssessment ? getAssessResponse(updatedAssessment) : null;
  }

  async deleteAssess(id: string, userId: string) {
    const assessment = await this.getAssess(id);

    const { courseId, teacherId, type } = assessment;

    await this.registerActivity(
      courseId,
      teacherId,
      userId,
      type === AssessmentType.Exam ? Activity.DELETE_EXAM : Activity.DELETE_TASK,
    );

    const deletedAssessment = await this.repository.delete(id);
    return deletedAssessment ? getAssessResponse(deletedAssessment) : null;
  }

  // Tests relevantes:
  //
  // 1. sin assessments
  // 2. con assessments sin submissions
  // 3. con assessments con submissions
  async calculateCoursePerformanceSummary(courseId: number, from: Date | undefined, till: Date | undefined): Promise<CoursePerformanceDto> {
    const assessments = await this.findAssessmentsByCourse(courseId);
    const assessmentCount = assessments.length;

    const enrollments = await this.courseRepository.findCourseEnrollments(courseId);
    const studentCount = enrollments.filter(e => e.role == Role.STUDENT).length;

    let gradesSum = 0;
    let gradesCount = 0;
    let completionCount = 0;
    let submissionCount = 0;
    let openCount = 0;

    // TODO: definir bien como conseguimos esto
    const now = new Date();

    for (const a of assessments) {

    }

    /*

    1. Definir como usar las fechas (formato)

    gradeAverage (submissions):
      si la fecha de correccion (noteCreatedAt) cae entre el intervalo dado
    
    completionRate (submissions):
      si esta entregada (submitAt) entre el intervalo
      si el largo de ejercicios es igual al largo de respuestas

    totalClosedAssessments (assessments):
      si el assessment cierra antes de from y despues de till

    totalSubmissions (submissions):
      la cantidad de assessments (submitAt) entre el intervalo

    openRate (assessments):
      si el deadline cae luego del till

    */

    return {
      averageGrade: gradesSum / Math.max(1, gradesCount),
      completionRate: completionCount / Math.max(1, studentCount),
      totalAssessments: assessmentCount,
      totalSubmissions: submissionCount,
      openRate: openCount / Math.max(1, submissionCount),
    } as CoursePerformanceDto;
  }

  // Tests relevantes:
  //
  // 1. sin assessments
  // 2. con assessments sin submissions
  // 3. con assessments con submissions
  async calculateStudentPerformanceSummaryInCourse(courseId: number, studentId: number): Promise<StudentPerformanceInCourseDto> {
    const assessments = await this.findAssessmentsByCourse(courseId);
    const assessmentCount = assessments.length;

    let gradesSum = 0;
    let gradesCount = 0;
    let completionCount = 0;

    for (const a of assessments) {
      // TODO reemplazar por:
      // const s = a.submitions[studentId];
      const s = { submittedAt: null, noteCreatedAt: null, note: null, exercises: [] };
      if (!s) {
        continue;
      }

      const exercisesCount = a.exercises.length;
      if (s.submittedAt && exercisesCount == s.exercises.length) {
        completionCount++;
      }

      if (s.noteCreatedAt && s.note) {
        gradesSum += s.note
        gradesCount++;
      }
    }

    return {
      averageGrade: gradesSum / Math.max(1, gradesCount),
      completedAssessments: completionCount,
      totalAssessments: assessmentCount,
    } as StudentPerformanceInCourseDto;
  }

  // Tests relevantes:
  //
  // 1. sin assessments
  // 2. con assessments sin submissions
  // 3. con assessments con submissions
  async calculateAssessmentPerformanceSummariesInCourse(courseId: number): Promise<AssessmentPerformanceDto[]> {
    const assessments = await this.findAssessmentsByCourse(courseId);
    const enrollments = await this.courseRepository.findCourseEnrollments(courseId);
    const studentCount = enrollments.filter(e => e.role == Role.STUDENT).length;

    return assessments.map(a => {
      let gradesSum = 0;
      let gradesCount = 0;
      let completionCount = 0;

      // TODO reemplazar por:
      // for (const s of a.submitions) {
      for (const s of [{ submittedAt: null, note: null }]) {
        if (!s.submittedAt) {
          continue;
        }

        if (s.note) {
          gradesSum += s.note;
          gradesCount++;
        }
      }

      return {
        title: a.title,
        averageGrade: gradesSum / Math.max(1, gradesCount),
        completionRate: completionCount / Math.max(1, studentCount),
      } as AssessmentPerformanceDto;
    });
  }
}

const logger = new Logger(AssessmentService.name);
