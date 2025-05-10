import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Course, Enrollment } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from 'src/logger';
import { CourseUpdateEnrollmentDto } from 'src/dtos/course.update.enrollment';

const PRISMA_NOT_FOUND_CODE = 'P2025';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new course in the database.
   */
  create(data: Prisma.CourseCreateInput): Promise<Course> {
    return this.prisma.course.create({ data });
  }

  /**
   * Updates an existing course in the database.
   */
  async update(id: number, data: Prisma.CourseUpdateInput): Promise<Course> {
    return await this.prisma.course.update({ where: { id }, data });
  }

  /**
   * Retrieves all courses from the database.
   */
  findAll(): Promise<Course[]> {
    return this.prisma.course.findMany();
  }

  /**
   * Finds a course by its ID.
   */
  findById(id: number): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { id } });
  }

  /**
   * Deletes a course by ID.
   */
  async delete(id: number): Promise<Course | null> {
    try {
      return await this.prisma.course.delete({ where: { id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND_CODE) {
        logger.error(`Course with ID ${id} not found.`);
        return Promise.resolve(null);
      }
      throw error;
    }
  }

  /**
   * Creates a new enrollment record in the database.
   *
   * @param data - The data required to create an enrollment, adhering to the `Prisma.EnrollmentUncheckedCreateInput` type.
   * @returns A promise that resolves to the created `Enrollment` object, or `null` if the operation fails.
   * @throws {NotFoundException} If the course with the specified `courseId` does not exist (foreign key constraint failure).
   * @throws {ConflictException} If the user with the specified `userId` is already enrolled in the course (unique constraint failure).
   * @throws {Error} For any other unexpected errors during the operation.
   */
  async createEnrollment(data: Prisma.EnrollmentUncheckedCreateInput): Promise<Enrollment | null> {
    try {
      return await this.prisma.enrollment.create({ data });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new NotFoundException(`The course with ID ${data.courseId} was not found.`);
        }
        if (error.code === 'P2002') {
          // Unique constraint failed
          throw new ConflictException(
            `User ${data.userId} is already enrolled in course ${data.courseId}.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Retrieves a list of enrollments for a specific course.
   *
   * @param id - The unique identifier of the course.
   * @returns A promise that resolves to an array of `Enrollment` objects associated with the course,
   *          or `null` if no enrollments are found.
   */
  async findCourseEnrollments(id: number): Promise<Enrollment[] | null> {
    return this.prisma.enrollment.findMany({
      where: { courseId: id },
    });
  }

  async updateEnrollment(
    courseId: number,
    userId: string,
    data: CourseUpdateEnrollmentDto,
  ): Promise<Enrollment | null> {
    try {
      return await this.prisma.enrollment.update({
        where: {
          courseId_userId: { courseId, userId },
        },
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND_CODE) {
        logger.error(`Enrollment for user ${userId} in course ${courseId} not found.`);
        throw new NotFoundException(
          `Enrollment for user ${userId} in course ${courseId} not found.`,
        );
      }
      throw error;
    }
  }

  // /**
  //  * Retrieves an enrollment record for a specific course and user.
  //  *
  //  * @param courseId - The unique identifier of the course.
  //  * @param userId - The unique identifier of the user.
  //  * @returns A promise that resolves to the enrollment record if found, or `null` if no matching record exists.
  //  */
  // async findCourseEnrollmentByUserId(courseId: number, userId: string): Promise<Enrollment | null> {
  //   return this.prisma.enrollment.findUnique({
  //     where: {
  //       courseId_userId: {
  //         courseId,
  //         userId,
  //       },
  //     },
  //   });
  // }

  /**
   * Deletes an enrollment for a specific user in a specific course.
   *
   * @param courseId - The ID of the course from which the enrollment will be deleted.
   * @param userId - The ID of the user whose enrollment will be deleted.
   * @returns A promise that resolves to the deleted `Enrollment` object, or `null` if no enrollment was found.
   * @throws {NotFoundException} If the enrollment for the specified user and course is not found.
   * @throws {Error} If any other error occurs during the deletion process.
   */
  async deleteEnrollment(courseId: number, userId: string): Promise<Enrollment | null> {
    try {
      return await this.prisma.enrollment.delete({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND_CODE) {
        logger.error(`Enrollment for user ${userId} in course ${courseId} not found.`);
        throw new NotFoundException(
          `Enrollment for user ${userId} in course ${courseId} not found.`,
        );
      }
      throw error;
    }
  }
}
