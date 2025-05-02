import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CourseRequestDto } from '../dtos/course.request.dto';
import { CourseResponseDto } from '../dtos/course.response.dto';
import { CourseRepository } from '../repositories/course.repository';
import { Course } from '@prisma/client';
import { CourseUpdateDto } from 'src/dtos/course.update.dto';

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
  async updateCourse(
    id: number,
    updateDTO: CourseUpdateDto,
  ): Promise<CourseResponseDto | undefined> {
    const course = await this.repository.findById(id);
    if (!course) {
      return;
    }

    validateCourseUpdate(updateDTO, course);

    const updatedCourse = await this.repository.update(id, updateDTO);

    if (!updatedCourse) {
      throw new InternalServerErrorException(
        `Unexpected error while trying to update course ${id}.`,
      );
    }

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
}
