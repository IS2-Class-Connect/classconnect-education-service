import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CourseRequestDto } from '../dtos/course.request.dto';
import { CourseResponseDto } from '../dtos/course.response.dto';
import { CourseRepository, EnrollmentWithCourse } from '../repositories/course.repository';
import { Course, Enrollment } from '@prisma/client';
import { CourseUpdateDto } from 'src/dtos/course.update.dto';
import { CourseCreateEnrollmentDto } from 'src/dtos/course.create.enrollment';
import { CourseUpdateEnrollmentDto } from 'src/dtos/course.update.enrollment';
import { EnrollmentFilterDto } from 'src/dtos/enrollment.filter';
import { EnrollmentResponseDto } from 'src/dtos/enrollments.response';

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
  async updateCourse(id: number, updateDTO: CourseUpdateDto): Promise<CourseResponseDto | null> {
    const course = await this.repository.findById(id);
    if (!course) {
      throw new NotFoundException(`The course with ID ${id} was not found.`);
    }

    validateCourseUpdate(updateDTO, course);

    const updatedCourse = await this.repository.update(id, updateDTO);

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

    if (!(await this.repository.findById(courseId))) {
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }

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

    if (!(await this.repository.findById(courseId))) {
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }

    return await this.repository.deleteEnrollment(courseId, userId);
  }
}
