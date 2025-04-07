import { Injectable } from '@nestjs/common';
import { CourseRequestDTO } from '../dtos/course.request.dto';
import { CourseResponseDTO } from '../dtos/course.response.dto';
import { Course } from '../entities/course';
import { CourseRepository } from '../repositories/course.repository';
import { logger } from 'src/logger';

/**
 * Service class responsible for business logic related to Courses.
 */
@Injectable()
export class CourseService {
  private repository: CourseRepository = new CourseRepository();
  private idCounter: number = 1;

  private getResponseDTO(course: Course): CourseResponseDTO {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
    };
  }

  /**
   * Sets a custom repository (useful for testing).
   * @param repository - The repository instance to use.
   */
  setRepository(repository: CourseRepository) {
    this.repository = repository;
  }

  /**
   * Creates a new course.
   * @param requestDTO - The data transfer object containing course data.
   * @returns The newly created course.
   */
  createCourse(requestDTO: CourseRequestDTO): CourseResponseDTO {
    const course: Course = {
      id: this.idCounter++,
      createdAt: new Date(),
      ...requestDTO,
    };
    this.repository.create(course);
    return this.getResponseDTO(course);
  }

  /**
   * Retrieves all courses.
   * @returns An array of all courses.
   */
  findAllCourses(): CourseResponseDTO[] {
    const courses: CourseResponseDTO[] = this.repository
      .findAll()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((course) => this.getResponseDTO(course));
    return courses;
  }

  /**
   * Finds a course by its ID.
   * @param id - The ID of the course.
   * @returns The course if found, otherwise `undefined`.
   */
  findCourseById(id: number): CourseResponseDTO | undefined {
    const course = this.repository.findById(id);
    return course ? this.getResponseDTO(course) : undefined;
  }

  /**
   * Deletes a course by its ID.
   * @param id - The ID of the course.
   * @returns `true` if the course was deleted, `false` otherwise.
   */
  deleteCourse(id: number): boolean {
    return this.repository.delete(id);
  }
}
