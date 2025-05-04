import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Course, Enrollment } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from 'src/logger';

const PRISMA__NOT_FOUND_CODE = 'P2025';

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
    try {
      return await this.prisma.course.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`The course with ID ${id} was not found.`);
      }
      throw error; // Re-throw other unexpected errors
    }
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

  async findCourseEnrollments(id: number): Promise<Enrollment[] | null> {
    return this.prisma.enrollment.findMany({
      where: { courseId: id },
    });
  }

  /**
   * Deletes a course by ID.
   */
  async delete(id: number): Promise<Course | null> {
    try {
      return await this.prisma.course.delete({ where: { id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA__NOT_FOUND_CODE) {
        logger.error(`Course with ID ${id} not found.`);
        return Promise.resolve(null);
      }
      throw error;
    }
  }

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

  async findCourseEnrollmentByUserId(courseId: number, userId: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });
  }

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
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA__NOT_FOUND_CODE) {
        logger.error(`Enrollment for user ${userId} in course ${courseId} not found.`);
        throw new NotFoundException(
          `Enrollment for user ${userId} in course ${courseId} not found.`,
        );
      }
      throw error;
    }
  }
}
