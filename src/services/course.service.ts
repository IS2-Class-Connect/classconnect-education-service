import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CourseRequestDto } from '../dtos/course/course.request.dto';
import { CourseResponseDto } from '../dtos/course/course.response.dto';
import { CourseRepository, EnrollmentWithCourse } from '../repositories/course.repository';
import { Activity, ActivityRegister, Course, Prisma, Role } from '@prisma/client';
import { CourseUpdateDto } from 'src/dtos/course/course.update.dto';
import { CourseCreateEnrollmentDto } from 'src/dtos/enrollment/course.create.enrollment.dto';
import { CourseUpdateEnrollmentDto } from 'src/dtos/enrollment/course.update.enrollment.dto';
import { EnrollmentFilterDto } from 'src/dtos/enrollment/enrollment.filter.dto';
import { CourseEnrollmentDto } from 'src/dtos/enrollment/course.enrollment.dto';
import { ForbiddenUserException } from 'src/exceptions/exception.forbidden.user';
import { CourseModuleCreateDto } from 'src/dtos/module/course.module.create.dto';
import { CourseModuleUpdateDto } from 'src/dtos/module/course.module.update.dto';
import { CourseResourceCreateDto } from 'src/dtos/resources/course.resource.create.dto';
import { CourseResourceUpdateDto } from 'src/dtos/resources/course.resource.update.dto';
import { CourseFeedbackRequestDto } from 'src/dtos/feedback/course.feedback.request.dto';
import { StudentFeedbackRequestDto } from 'src/dtos/feedback/student.feedback.request.dto';
import { EnrollmentResponseDto } from 'src/dtos/enrollment/enrollment.response.dto';
import { CourseFilterDto } from 'src/dtos/course/course.filter.dto';
import { StudentFeedbackResponseDto } from 'src/dtos/feedback/student.feedback.response.dto';
import { CourseFeedbackResponseDto } from 'src/dtos/feedback/course.feedback.response.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getForbiddenExceptionMsg } from 'src/utils';

const MIN_PLACES_LIMIT = 1;

/**
 * Generates a CourseResponseDto from a Course object.
 * @param course - The course object to be converted.
 * @returns The CourseResponseDto instance generated.
 */
function getResponseDTO(course: Course): CourseResponseDto {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    startDate: course.startDate.toISOString(),
    registrationDeadline: course.registrationDeadline.toISOString(),
    endDate: course.endDate.toISOString(),
    totalPlaces: course.totalPlaces,
    teacherId: course.teacherId,
  };
}

function getEnrollmentResponse(enrollment: EnrollmentWithCourse): CourseEnrollmentDto {
  const { userId, role, course } = enrollment;
  const { id, title } = course;
  return {
    role,
    userId,
    course: {
      id,
      title,
    },
  };
}

/**
 * Validates the data for createing a course.
 *
 * @param updateData - An object containing the updated course data.
 * @param course - The current course object being updated.
 *
 * @throws {BadRequestException} If the registration deadline is not a future date.
 * @throws {BadRequestException} If the start date is not a future date.
 * @throws {BadRequestException} If the end date is not after the start date or the registration deadline.
 * @throws {BadRequestException} If the total number of places is less than the minimum allowed.
 */
function validateCourse(course: CourseRequestDto) {
  const { startDate, endDate, registrationDeadline, totalPlaces } = course;
  const now = new Date();

  if (new Date(registrationDeadline) <= now) {
    throw new BadRequestException('Registration deadline must be a future date.');
  }

  if (new Date(startDate) <= now) {
    throw new BadRequestException('Start date must be a future date.');
  }

  if (new Date(endDate) <= new Date(startDate)) {
    throw new BadRequestException('End date must be after the start date.');
  }

  if (new Date(endDate) <= new Date(registrationDeadline)) {
    throw new BadRequestException('End date must be after the registration deadline.');
  }

  if (totalPlaces < MIN_PLACES_LIMIT) {
    throw new BadRequestException(`Total places must be at least ${MIN_PLACES_LIMIT}.`);
  }
}

/**
 * Validates the data for updating a course.
 *
 * @param updateData - An object containing the updated course data.
 * @param course - The current course object being updated.
 *
 * @throws {BadRequestException} If the registration deadline is not a future date.
 * @throws {BadRequestException} If the start date is not a future date.
 * @throws {BadRequestException} If the end date is not after the start date or the registration deadline.
 * @throws {BadRequestException} If the total number of places is less than the minimum allowed.
 */
function validateCourseUpdate(updateData: CourseUpdateDto, course: Course) {
  const { startDate, endDate, registrationDeadline, totalPlaces } = updateData;
  const now = new Date();

  if (registrationDeadline && new Date(registrationDeadline) <= now) {
    throw new BadRequestException('Registration deadline must be a future date.');
  }

  if (startDate && new Date(startDate) <= now) {
    throw new BadRequestException('Start date must be a future date.');
  }

  if (
    endDate &&
    ((startDate && new Date(endDate) <= new Date(startDate)) ||
      new Date(endDate) <= course.startDate)
  ) {
    throw new BadRequestException('End date must be after the start date.');
  }

  if (
    endDate &&
    ((registrationDeadline && new Date(endDate) <= new Date(registrationDeadline)) ||
      new Date(endDate) <= course.registrationDeadline)
  ) {
    throw new BadRequestException('End date must be after the registration deadline.');
  }

  if (totalPlaces && totalPlaces < MIN_PLACES_LIMIT) {
    throw new BadRequestException(`Total places must be at least ${MIN_PLACES_LIMIT}.`);
  }
}

/**
 * Service class responsible for business logic related to Courses.
 */
@Injectable()
export class CourseService {
  constructor(
    private readonly repository: CourseRepository,
    private readonly genAI: GoogleGenerativeAI,
  ) {}

  private async getCourse(id: number) {
    const course = await this.repository.findById(id);
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
      const userEnrollmentToCourse = await this.repository.findEnrollment(courseId, userId);
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

      await this.repository.createActivityRegister(activityData);
    }
  }

  private async moduleBelongsToCourse(moduleId: string, courseId: number) {
    const module = await this.repository.findModule(moduleId);
    if (!module || module.courseId != courseId) {
      throw new NotFoundException(`Module ${moduleId} from course ${courseId} not found.`);
    }
  }

  /**
   * Creates a new course.
   * @param requestDTO - The data transfer object containing course data.
   * @returns The newly created course response DTO.
   */
  async createCourse(requestDTO: CourseRequestDto): Promise<CourseResponseDto> {
    validateCourse(requestDTO);
    const course = await this.repository.create(requestDTO);
    return getResponseDTO(course);
  }

  /**
   * Creates a new course.
   * @param id - The ID of the course to be updated.
   * @param updateDTO - The data transfer object containing course data.
   * @returns The newly created course response DTO, or null if non course with the id exist.
   * @throws {NotFoundException} If the course trying to update is not found.
   */
  async updateCourse(id: number, updateDTO: CourseUpdateDto): Promise<CourseResponseDto> {
    const course = await this.getCourse(id);

    validateCourseUpdate(updateDTO, course);

    const { userId, ...updateData } = updateDTO;

    await this.registerActivity(id, course.teacherId, userId, Activity.EDIT_COURSE);

    const updatedCourse = await this.repository.update(id, updateData);

    return getResponseDTO(updatedCourse);
  }

  /**
   * Retrieves all courses matching the filters.
   * @param filter - The filter criteria for retrieving courses.
   * @returns An array of all courses.
   */
  async findCourses(filters: CourseFilterDto): Promise<CourseResponseDto[]> {
    const isEmpty = !filters || Object.keys(filters).length === 0;
    const courses = (
      await (isEmpty ? this.repository.findAll() : this.repository.findCourses(filters))
    )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((course) => getResponseDTO(course));
    return courses;
  }

  /**
   * Finds a course by its ID.
   * @param id - The ID of the course.
   * @returns The course if found, otherwise `undefined`.
   */
  async findCourseById(id: number): Promise<CourseResponseDto | undefined> {
    const course = await this.repository.findById(id);
    return course ? getResponseDTO(course) : undefined;
  }

  /**
   * Deletes a course by its ID.
   * @param id - The ID of the course.
   * @returns `true` if the course was deleted, `false` otherwise.
   */
  async deleteCourse(id: number): Promise<CourseResponseDto | null> {
    const course = await this.repository.delete(id);
    return course ? getResponseDTO(course) : null;
  }

  /**
   * Creates a new enrollment for a specified course.
   *
   * @param courseId - The ID of the course to enroll in. Must be a positive integer.
   * @param userEnrollment - The enrollment details provided as a `CourseCreateEnrollmentDto` object.
   * @returns A promise that resolves to the created `Enrollment` object, or `null` if the operation fails.
   * @throws {BadRequestException} If the provided `courseId` is not a valid positive integer.
   */
  async createEnrollment(
    courseId: number,
    userEnrollment: CourseCreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }
    const enrollment = await this.repository.createEnrollment({ courseId, ...userEnrollment });
    if (!enrollment) {
      return null;
    }
    return (({ courseId, role, userId, favorite }) => ({ courseId, role, userId, favorite }))(
      enrollment,
    );
  }

  async updateEnrollment(
    courseId: number,
    userId: string,
    enrollmentUpdateDto: CourseUpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }
    const enrollment = await this.repository.updateEnrollment(
      courseId,
      userId,
      enrollmentUpdateDto,
    );
    if (!enrollment) {
      return null;
    }
    return (({ courseId, role, userId, favorite }) => ({ courseId, role, userId, favorite }))(
      enrollment,
    );
  }

  /**
   * Retrieves the enrollments for a specific course.
   *
   * @param courseId - The ID of the course for which to retrieve enrollments.
   * @returns A promise that resolves to an array of enrollments for the specified course,
   *          or `null` if no enrollments are found.
   * @throws {BadRequestException} If the provided course ID is not a valid positive integer.
   * @throws {NotFoundException} If no course is found with the specified ID.
   */
  async getCourseEnrollments(courseId: number): Promise<EnrollmentResponseDto[] | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }

    await this.getCourse(courseId);

    const enrollments = await this.repository.findCourseEnrollments(courseId);

    return enrollments.map((enrollment) =>
      (({ courseId, role, userId, favorite }) => ({ courseId, role, userId, favorite }))(
        enrollment,
      ),
    );
  }

  async getEnrollments(filters: EnrollmentFilterDto) {
    return (await this.repository.findEnrollments(filters)).map((enrollment) =>
      getEnrollmentResponse(enrollment),
    );
  }

  /**
   * Deletes an enrollment for a specific course and user.
   *
   * @param courseId - The ID of the course from which the enrollment will be deleted.
   *                   Must be a positive integer.
   * @param userId - The ID of the user whose enrollment will be deleted.
   * @returns A promise that resolves to the deleted `Enrollment` object if successful,
   *          or `null` if no enrollment was found to delete.
   * @throws {BadRequestException} If the provided `courseId` is not a valid positive integer.
   * @throws {NotFoundException} If the course with the specified `courseId` does not exist.
   */
  async deleteEnrollment(courseId: number, userId: string): Promise<EnrollmentResponseDto | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }

    await this.getCourse(courseId);
    const enrollment = await this.repository.deleteEnrollment(courseId, userId);

    if (!enrollment) {
      return null;
    }

    return (({ courseId, role, userId, favorite }) => ({ courseId, role, userId, favorite }))(
      enrollment,
    );
  }

  async createCourseFeedback(courseId: number, userId: string, feedback: CourseFeedbackRequestDto) {
    await this.repository.updateEnrollment(courseId, userId, feedback);
  }

  async createStudentFeedback(
    courseId: number,
    userId: string,
    feedback: StudentFeedbackRequestDto,
  ) {
    const course = await this.getCourse(courseId);
    const { teacherId, ...updateData } = feedback;
    if (course.teacherId != teacherId) {
      throw new ForbiddenUserException(
        `User ${userId} is not allowed to create feedback for course ${courseId}. Only the head teacher is allowed.`,
      );
    }
    await this.repository.updateEnrollment(courseId, userId, updateData);
  }

  async getCourseFeedback(courseId: number, userId: string): Promise<CourseFeedbackResponseDto> {
    const enrollment = await this.repository.findEnrollment(courseId, userId);
    if (!enrollment || !(enrollment.courseFeedback && enrollment.courseNote)) {
      throw new NotFoundException(
        `Feedback for course ${courseId} made by user ${userId} not found.`,
      );
    }
    const { courseFeedback, courseNote } = enrollment;
    return {
      courseFeedback,
      courseNote,
      studentId: userId,
    };
  }

  async getStudentFeedback(courseId: number, userId: string): Promise<StudentFeedbackResponseDto> {
    const enrollment = await this.repository.findEnrollment(courseId, userId);
    if (!enrollment || !(enrollment.studentFeedback && enrollment.studentNote)) {
      throw new NotFoundException(`Feedback for user ${userId} in course ${courseId} not found.`);
    }
    const { studentFeedback, studentNote } = enrollment;
    return { studentFeedback, studentNote, courseId };
  }

  async getCourseFeedbacks(
    courseId: number,
  ): Promise<{ feedbacks: CourseFeedbackResponseDto[]; summary: string }> {
    await this.getCourse(courseId);
    const enrollments = await this.repository.findCourseEnrollments(courseId);
    const feedbacks = enrollments.flatMap(({ courseFeedback, courseNote, userId }) => {
      if (courseFeedback && courseNote) {
        return {
          courseFeedback,
          courseNote,
          studentId: userId,
        };
      }
      return [];
    }) as CourseFeedbackResponseDto[];
    const prompt = [
      'Summarize the following course feedbacks in a concise paragraph.',
      'Each feedback consists of a comment and a numeric rating (from 1 to 5) given by a student.',
      'Highlight the main strengths and weaknesses mentioned, and provide an overall impression of the course based on the feedbacks.',
      'If there is only one feedback, provide a very brief analysis (no more than two sentences) of it',
      'If there are no feedbacks, just say that there are no feedbacks.',
      'Here are the feedbacks:',
      JSON.stringify(feedbacks, null, 2),
    ].join('\n');
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();
    return { feedbacks, summary };
  }

  async getStudentFeedbacks(
    studentId: string,
  ): Promise<{ feedbacks: StudentFeedbackResponseDto[]; summary: string }> {
    const enrollments = await this.repository.findEnrollments({ userId: studentId });
    const feedbacks = enrollments.flatMap(({ studentFeedback, studentNote, courseId }) => {
      if (studentFeedback && studentNote) {
        return {
          studentFeedback,
          studentNote,
          courseId,
        };
      }
      return [];
    }) as StudentFeedbackResponseDto[];

    const prompt = [
      'Summarize the following student feedbacks in a concise paragraph.',
      'Each feedback consists of a comment and a numeric rating (from 1 to 5) given by the head teacher of a course.',
      'Highlight the main strengths and weaknesses mentioned, and provide an overall impression of the student performance based on the feedbacks.',
      'If there is only one feedback, provide a very brief analysis (no more than two sentences) of it',
      'If there are no feedbacks, just say that there are no feedbacks.',
      'Here are the feedbacks:',
      JSON.stringify(feedbacks, null, 2),
    ].join('\n');
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();
    return { feedbacks, summary };
  }

  async getActivities(courseId: number, userId: string): Promise<ActivityRegister[]> {
    const course = await this.getCourse(courseId);
    if (course.teacherId != userId) {
      throw new ForbiddenUserException(
        `User ${userId} is not allowed to get the activity register of the course ${courseId}. Only the head teacher is allowed.`,
      );
    }

    return this.repository.findActivityRegisterByCourse(courseId);
  }

  async createModule(courseId: number, createDto: CourseModuleCreateDto) {
    const course = await this.getCourse(courseId);

    const { userId, ...createData } = createDto;

    await this.registerActivity(courseId, course.teacherId, userId, Activity.ADD_MODULE);

    return this.repository.createModule({ courseId, ...createData });
  }

  async getAllCourseModules(courseId: number) {
    await this.getCourse(courseId);
    return this.repository.findModulesByCourse(courseId);
  }

  async getCourseModule(courseId: number, moduleId: string) {
    await this.getCourse(courseId);
    return await this.repository.findModule(moduleId);
  }

  async updateModule(courseId: number, moduleId: string, updateDto: CourseModuleUpdateDto) {
    const course = await this.getCourse(courseId);
    const { userId, ...updateData } = updateDto;
    await this.registerActivity(courseId, course.teacherId, userId, Activity.EDIT_MODULE);
    return this.repository.updateModule(moduleId, updateData);
  }

  async deleteModule(courseId: number, userId: string, moduleId: string) {
    const course = await this.getCourse(courseId);
    await this.registerActivity(courseId, course.teacherId, userId, Activity.DELETE_MODULE);
    return this.repository.deleteModule(moduleId);
  }

  async createResource(courseId: number, moduleId: string, createDto: CourseResourceCreateDto) {
    const course = await this.getCourse(courseId);
    await this.moduleBelongsToCourse(moduleId, courseId);
    const { userId, ...createData } = createDto;
    await this.registerActivity(courseId, course.teacherId, userId, Activity.EDIT_MODULE);
    return this.repository.createResource({ moduleId, ...createData });
  }

  async getAllModuleResources(courseId: number, moduleId: string) {
    await this.getCourse(courseId);
    await this.moduleBelongsToCourse(moduleId, courseId);
    return this.repository.findResourcesByModule(moduleId);
  }

  async getModuleResource(courseId: number, moduleId: string, link: string) {
    await this.getCourse(courseId);
    await this.moduleBelongsToCourse(moduleId, courseId);
    return await this.repository.findResource(moduleId, link);
  }

  async updateResource(
    courseId: number,
    moduleId: string,
    link: string,
    updateDto: CourseResourceUpdateDto,
  ) {
    const course = await this.getCourse(courseId);
    await this.moduleBelongsToCourse(moduleId, courseId);
    const { userId, ...updateData } = updateDto;
    await this.registerActivity(courseId, course.teacherId, userId, Activity.EDIT_MODULE);
    return this.repository.updateResource(moduleId, link, updateData);
  }

  async deleteResource(courseId: number, userId: string, moduleId: string, link: string) {
    const course = await this.getCourse(courseId);
    await this.moduleBelongsToCourse(moduleId, courseId);
    await this.registerActivity(courseId, course.teacherId, userId, Activity.EDIT_MODULE);
    return this.repository.deleteResource(moduleId, link);
  }
}

const logger = new Logger(CourseService.name);
