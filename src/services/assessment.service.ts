import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Activity, Prisma, Role } from '@prisma/client';
import { AssessmentCreateDto } from 'src/dtos/assessment/assessment.create.dto';
import { AssessmentFilterDto } from 'src/dtos/assessment/assessment.filter.dto';
import { AssessmentResponseDto } from 'src/dtos/assessment/assessment.response.dto';
import { AssessmentUpdateDto } from 'src/dtos/assessment/assessment.update.dto';
import { CorrectionCreateDto } from 'src/dtos/correction/correction.create.dto';
import { SubmissionCreateDto } from 'src/dtos/submission/submission.create.dto';
import { SubmissionResponseDto } from 'src/dtos/submission/submission.response.dto';
import { ForbiddenUserException } from 'src/exceptions/exception.forbidden.user';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Assessment, AssessmentType } from 'src/schema/assessment.schema';
import { Submission, SubmittedAnswer } from 'src/schema/submission.schema';
import { getForbiddenExceptionMsg } from 'src/utils';

function getAssessResponse(asses: Assessment): AssessmentResponseDto {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { submissions, ...assesResponse } = asses;
  return assesResponse;
}

function getSubmissionResponse(
  submission: Submission,
  assesId: string,
  userId: string,
): SubmissionResponseDto {
  return { ...submission, assesId, userId };
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

  async createSubmission(id: string, createDto: SubmissionCreateDto) {
    const { userId, answers } = createDto;
    const asses = await this.getAssess(id);
    if (asses.submissions && asses.submissions[userId]) {
      throw new ConflictException(`Submission for user ${userId} already exists`);
    }
    const enrollment = await this.courseRepository.findEnrollment(asses.courseId, userId);
    if (!enrollment || enrollment.role != Role.STUDENT)
      throw new ForbiddenUserException(
        `User ${userId} is not authorized to sumbit the assessment. Only course ${asses.courseId} students can submit the assessment.`,
      );
    const submittedAnswers: SubmittedAnswer[] = answers.map((answer) => ({
      answer,
      correction: '',
    }));
    const createData: Submission = { answers: submittedAnswers, submittedAt: new Date() };
    const submission = await this.repository.setAssesSubmission(id, userId, createData);
    return getSubmissionResponse(submission, id, userId);
  }

  async getAssesSubmissions(id: string) {
    const submissions = (await this.getAssess(id)).submissions;
    if (!submissions) {
      return [];
    }
    return Object.entries(submissions).map(([userId, submission]) =>
      getSubmissionResponse(submission, id, userId),
    );
  }

  async getAssesSubmission(assesId: string, userId: string) {
    const asses = await this.getAssess(assesId);
    const userSubmission = asses.submissions?.[userId];
    if (!userSubmission)
      throw new NotFoundException(
        `Submission of user ${userId} not found in assessment ${assesId}`,
      );
    return getSubmissionResponse(userSubmission, assesId, userId);
  }

  async createCorrection(assesId: string, userId: string, createDto: CorrectionCreateDto) {
    const { teacherId, corrections, ...correctionData } = createDto;

    const asses = await this.getAssess(assesId);
    const course = await this.getCourse(asses.courseId);
    if (course.teacherId != teacherId)
      throw new ForbiddenUserException(
        `User ${teacherId} is not authorized to correct the submission. Only the course ${asses.courseId} head teacher can correct the course submissions`,
      );

    const submission = asses.submissions?.[userId];
    if (!submission)
      throw new NotFoundException(
        `Submission of user ${userId} not found in assessment ${assesId}.`,
      );

    if (submission.answers.length != corrections.length)
      throw new BadRequestException('There must be the same number of corrections as answers');
    submission.answers.forEach((answer, idx) => {
      answer.correction = corrections[idx];
    });
    // TODO: Add AI feedback
    const correctedSubmission: Submission = {
      ...submission,
      ...correctionData,
      correctedAt: new Date(),
    };
    return getSubmissionResponse(
      await this.repository.setAssesSubmission(assesId, userId, correctedSubmission),
      assesId,
      userId,
    );
  }
}

const logger = new Logger(AssessmentService.name);
