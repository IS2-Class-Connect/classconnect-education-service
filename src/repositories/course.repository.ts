import { logger } from 'src/logger';
import { Course } from '../entities/course';

/**
 * Repository class responsible for managing Course entities in memory.
 */
export class CourseRepository {
  private courses: Map<number, Course> = new Map<number, Course>();

  /**
   * Retrieves all courses.
   * @returns An array of all stored courses.
   */
  findAll(): Course[] {
    return Array.from(this.courses.values());
  }

  /**
   * Finds a course by its ID.
   * @param id - The ID of the course to find.
   * @returns The course if found, otherwise `undefined`.
   */
  findById(id: number): Course | undefined {
    return this.courses.get(id);
  }

  /**
   * Creates a new course.
   * @param course - The course to create.
   * @returns The created course.
   */
  create(course: Course): Course {
    this.courses.set(course.id, course);
    return course;
  }

  /**
   * Deletes a course by its ID.
   * @param id - The ID of the course to delete.
   * @returns `true` if the course was deleted, `false` if it did not exist.
   */
  delete(id: number): boolean {
    return this.courses.delete(id);
  }
}
