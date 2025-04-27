import { Injectable } from '@nestjs/common';
import { CourseRequestDTO } from '../dtos/course.request.dto';
import { CourseResponseDTO } from '../dtos/course.response.dto';
import { CourseRepository } from '../repositories/course.repository';
import { logger } from 'src/logger';
import { Course } from '@prisma/client';

/**
 * Service class responsible for business logic related to Courses.
 */
@Injectable()
export class CourseService {
  constructor(private readonly repository: CourseRepository) {}

  private getResponseDTO(course: Course): CourseResponseDTO {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
    };
  }

  /**
   * Creates a new course.
   * @param requestDTO - The data transfer object containing course data.
   * @returns The newly created course.
   */
  async createCourse(requestDTO: CourseRequestDTO): Promise<CourseResponseDTO> {
    const course = await this.repository.create(requestDTO);
    return this.getResponseDTO(course);
  }

  /**
   * Retrieves all courses.
   * @returns An array of all courses.
   */
  async findAllCourses(): Promise<CourseResponseDTO[]> {
    const courses: CourseResponseDTO[] = (await this.repository.findAll())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((course) => this.getResponseDTO(course));
    return courses;
  }

  /**
   * Finds a course by its ID.
   * @param id - The ID of the course.
   * @returns The course if found, otherwise `undefined`.
   */
  async findCourseById(id: number): Promise<CourseResponseDTO | undefined> {
    const course = await this.repository.findById(id);
    return course ? this.getResponseDTO(course) : undefined;
  }

  /**
   * Deletes a course by its ID.
   * @param id - The ID of the course.
   * @returns `true` if the course was deleted, `false` otherwise.
   */
  async deleteCourse(id: number): Promise<CourseResponseDTO | null> {
    const course = await this.repository.delete(id);
    return course ? this.getResponseDTO(course) : null;
  }
}
