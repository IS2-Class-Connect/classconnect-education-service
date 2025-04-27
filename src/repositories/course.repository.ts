import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Course } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from 'src/logger';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

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
   * Creates a new course in the database.
   */
  create(data: Prisma.CourseCreateInput): Promise<Course> {
    return this.prisma.course.create({ data });
  }

  /**
   * Deletes a course by ID.
   */
  async delete(id: number): Promise<Course | null> {
    try {
      return await this.prisma.course.delete({ where: { id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        logger.error(`Course with ID ${id} not found.`);
        return Promise.resolve(null);
      }
      throw error;
    }
  }
}
