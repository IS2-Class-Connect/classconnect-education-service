import { BadRequestException, Injectable } from '@nestjs/common';
import { CourseRequestDTO } from '../dtos/course.request.dto';
import { CourseResponseDTO } from '../dtos/course.response.dto';
import { CourseRepository } from '../repositories/course.repository';
import { Course } from '@prisma/client';

const MIN_PLACES_LIMIT = 1;

function getResponseDTO(course: Course): CourseResponseDTO {
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

function validateCourse(course: CourseRequestDTO) {
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
 * Service class responsible for business logic related to Courses.
 */
@Injectable()
export class CourseService {
  constructor(private readonly repository: CourseRepository) {}

  /**
   * Creates a new course.
   * @param requestDTO - The data transfer object containing course data.
   * @returns The newly created course.
   */
  async createCourse(requestDTO: CourseRequestDTO): Promise<CourseResponseDTO> {
    validateCourse(requestDTO);
    const course = await this.repository.create(requestDTO);
    return getResponseDTO(course);
  }

  /**
   * Retrieves all courses.
   * @returns An array of all courses.
   */
  async findAllCourses(): Promise<CourseResponseDTO[]> {
    const courses: CourseResponseDTO[] = (await this.repository.findAll())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((course) => getResponseDTO(course));
    return courses;
  }

  /**
   * Finds a course by its ID.
   * @param id - The ID of the course.
   * @returns The course if found, otherwise `undefined`.
   */
  async findCourseById(id: number): Promise<CourseResponseDTO | undefined> {
    const course = await this.repository.findById(id);
    return course ? getResponseDTO(course) : undefined;
  }

  /**
   * Deletes a course by its ID.
   * @param id - The ID of the course.
   * @returns `true` if the course was deleted, `false` otherwise.
   */
  async deleteCourse(id: number): Promise<CourseResponseDTO | null> {
    const course = await this.repository.delete(id);
    return course ? getResponseDTO(course) : null;
  }
}
