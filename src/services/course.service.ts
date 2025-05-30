import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CourseRequestDto } from '../dtos/course/course.request.dto';
import { CourseResponseDto } from '../dtos/course/course.response.dto';
import { CourseRepository, EnrollmentWithCourse } from '../repositories/course.repository';
import { Activity, ActivityRegister, Course, Enrollment, Prisma, Role } from '@prisma/client';
import { CourseUpdateDto } from 'src/dtos/course/course.update.dto';
import { CourseCreateEnrollmentDto } from 'src/dtos/enrollment/course.create.enrollment.dto';
import { CourseUpdateEnrollmentDto } from 'src/dtos/enrollment/course.update.enrollment.dto';
import { EnrollmentFilterDto } from 'src/dtos/enrollment/enrollment.filter.dto';
import { EnrollmentResponseDto } from 'src/dtos/enrollment/enrollments.response.dto';
import { ForbiddenUserException } from 'src/exceptions/exception.forbidden.user';
import { CourseModuleCreateDto } from 'src/dtos/module/course.module.create.dto';
import { logger } from 'src/logger';
import { CourseModuleUpdateDto } from 'src/dtos/module/course.module.update.dto';

const MIN_PLACES_LIMIT = 1;

function getForbiddenExceptionMsg(courseId: number, userId: string, activity: Activity): string {
  switch (activity) {
    case Activity.EDIT_COURSE:
      return `User ${userId} is not authorized to edit course ${courseId}.`;
    case Activity.ADD_MODULE:
      return `User ${userId} is not authorized to add a module to course ${courseId}.`;
    case Activity.EDIT_MODULE:
      return `User ${userId} is not authorized to edit a module in course ${courseId}.`;
    case Activity.DELETE_MODULE:
      return `User ${userId} is not authorized to delete a module from course ${courseId}.`;
    case Activity.ADD_EXAM:
      return `User ${userId} is not authorized to add an exam to course ${courseId}.`;
    case Activity.EDIT_EXAM:
      return `User ${userId} is not authorized to edit an exam in course ${courseId}.`;
    case Activity.DELETE_EXAM:
      return `User ${userId} is not authorized to delete an exam from course ${courseId}.`;
    case Activity.GRADE_EXAM:
      return `User ${userId} is not authorized to grade an exam in course ${courseId}.`;
    case Activity.ADD_TASK:
      return `User ${userId} is not authorized to add a task to course ${courseId}.`;
    case Activity.EDIT_TASK:
      return `User ${userId} is not authorized to edit a task in course ${courseId}.`;
    case Activity.DELETE_TASK:
      return `User ${userId} is not authorized to delete a task from course ${courseId}.`;
    case Activity.GRADE_TASK:
      return `User ${userId} is not authorized to grade a task in course ${courseId}.`;
    default:
      return `User ${userId} is not authorized to perform this action on course ${courseId}.`;
  }
}

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

function getEnrollmentResponse(enrollment: EnrollmentWithCourse): EnrollmentResponseDto {
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
  constructor(private readonly repository: CourseRepository) {}

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
   * Retrieves all courses.
   * @returns An array of all courses.
   */
  async findAllCourses(): Promise<CourseResponseDto[]> {
    const courses: CourseResponseDto[] = (await this.repository.findAll())
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
  ): Promise<Enrollment | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }
    return await this.repository.createEnrollment({ courseId, ...userEnrollment });
  }

  async updateEnrollment(
    courseId: number,
    userId: string,
    enrollmentUpdateDto: CourseUpdateEnrollmentDto,
  ): Promise<Enrollment | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }
    return await this.repository.updateEnrollment(courseId, userId, enrollmentUpdateDto);
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
  async getCourseEnrollments(courseId: number): Promise<Enrollment[] | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }

    await this.getCourse(courseId);

    return await this.repository.findCourseEnrollments(courseId);
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
  async deleteEnrollment(courseId: number, userId: string): Promise<Enrollment | null> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('Invalid course ID.');
    }

    await this.getCourse(courseId);

    return await this.repository.deleteEnrollment(courseId, userId);
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

  async updateCourseModule(courseId: number, moduleId: string, updateDto: CourseModuleUpdateDto) {
    const course = await this.getCourse(courseId);
    const { userId, ...updateData } = updateDto;
    await this.registerActivity(courseId, course.teacherId, userId, Activity.EDIT_MODULE);
    return this.repository.updateModule(moduleId, updateData);
  }

  async deleteCourseModule(courseId: number, userId: string, moduleId: string) {
    const course = await this.getCourse(courseId);
    await this.registerActivity(courseId, course.teacherId, userId, Activity.DELETE_MODULE);
    return this.repository.deleteModule(moduleId);
  }
}
