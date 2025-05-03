import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Course } from '@prisma/client';
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
    // return this.prisma.course.update({ where: { id }, data });
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
}
