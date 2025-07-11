import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Course, Enrollment, ActivityRegister } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EnrollmentFilterDto } from 'src/dtos/enrollment/enrollment.filter.dto';
import { CourseQueryDto } from 'src/dtos/course/course.query.dto';

const PRISMA_NOT_FOUND_CODE = 'P2025';

export type CourseWithEnrollments = Course & { enrollments: Enrollment[] };
export type EnrollmentWithCourse = Enrollment & { course: Course };
type EnrollmentFilter = EnrollmentFilterDto & { courseId?: number };

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
  findAll({ page, limit }: CourseQueryDto): Promise<Course[]> {
    const skip = (page - 1) * limit;
    return this.prisma.course.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
  }

  /**
   * Retrieves courses based on the provided query.
   * @param query - The specified properties values that the course have to match.
   * @returns A promise that resolves to the courses matching the query.
   */
  findCourses({
    page,
    limit,
    startDateGt,
    startDateLt,
    endDateGt,
    endDateLt,
    ...rest
  }: CourseQueryDto): Promise<Course[]> {
    const skip = (page - 1) * limit;
    const where: any = rest;
    if (startDateGt || startDateLt) {
      where.startDate = {};
      if (startDateGt) where.startDate.gte = startDateGt;
      if (startDateLt) where.startDate.lte = startDateLt;
    }

    if (endDateGt || endDateLt) {
      where.endDate = {};
      if (endDateGt) where.endDate.gte = endDateGt;
      if (endDateLt) where.endDate.lte = endDateLt;
    }
    return this.prisma.course.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
  }

  /**
   * Finds a course by its ID.
   */
  findById(
    id: number,
    withEnrollments: boolean = false,
  ): Promise<Course | CourseWithEnrollments | null> {
    return this.prisma.course.findUnique({
      where: { id },
      include: { enrollments: withEnrollments },
    });
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

  findEnrollment(courseId: number, userId: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
  }

  /**
   * Retrieves a list of enrollments for a specific course.
   *
   * @param id - The unique identifier of the course.
   * @returns A promise that resolves to an array of `Enrollment` objects associated with the course,
   *          or `null` if no enrollments are found.
   */
  findCourseEnrollments(id: number): Promise<Enrollment[]> {
    return this.prisma.enrollment.findMany({
      where: { courseId: id },
    });
  }

  async updateEnrollment(
    courseId: number,
    userId: string,
    data: Prisma.EnrollmentUpdateInput,
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
  //  * Retrieves the enrollments matching the filters values.
  //  *
  //  * @param filters - The specified properties values that the enrollment have to match.
  //  * @returns A promise that resolves to the enrollments.
  //  */
  async findEnrollments(filters: EnrollmentFilter): Promise<EnrollmentWithCourse[]> {
    return await this.prisma.enrollment.findMany({
      where: {
        ...filters,
      },
      include: { course: true },
    });
  }

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

  createActivityRegister(
    data: Prisma.ActivityRegisterUncheckedCreateInput,
  ): Promise<ActivityRegister> {
    return this.prisma.activityRegister.create({ data });
  }

  findActivityRegisterByCourse(courseId: number): Promise<ActivityRegister[]> {
    return this.prisma.activityRegister.findMany({ where: { courseId } });
  }

  createModule(data: Prisma.ModuleUncheckedCreateInput) {
    return this.prisma.module.create({ data });
  }

  findModule(id: string) {
    return this.prisma.module.findUnique({ where: { id } });
  }

  findModulesByCourse(courseId: number) {
    return this.prisma.module.findMany({
      where: { courseId },
    });
  }

  async updateModule(id: string, data: Prisma.ModuleUpdateInput) {
    try {
      return await this.prisma.module.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND_CODE) {
        logger.error(`The module with ID ${id} was not found.`);
        throw new NotFoundException(`Module ${id} not found.`);
      }
      throw error;
    }
  }

  async deleteModule(id: string) {
    try {
      return await this.prisma.module.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND_CODE) {
        logger.error(`The module with ID ${id} was not found.`);
        throw new NotFoundException(`Module ${id} not found.`);
      }
      throw error;
    }
  }

  createResource(data: Prisma.ResourceUncheckedCreateInput) {
    return this.prisma.resource.create({ data });
  }

  findResource(moduleId: string, link: string) {
    return this.prisma.resource.findUnique({ where: { link_moduleId: { link, moduleId } } });
  }

  findResourcesByModule(moduleId: string) {
    return this.prisma.resource.findMany({
      where: { moduleId },
    });
  }

  async updateResource(moduleId: string, link: string, data: Prisma.ResourceUpdateInput) {
    try {
      return await this.prisma.resource.update({
        where: { link_moduleId: { link, moduleId } },
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND_CODE) {
        logger.error(`The resource ${link} was not found in module ${moduleId}.`);
        throw new NotFoundException(`Resource ${link} in module ${moduleId} not found.`);
      }
      throw error;
    }
  }

  async deleteResource(moduleId: string, link: string) {
    try {
      return await this.prisma.resource.delete({
        where: { link_moduleId: { link, moduleId } },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND_CODE) {
        logger.error(`The resource ${link} was not found in module ${moduleId}.`);
        throw new NotFoundException(`Resource ${link} in module ${moduleId} not found.`);
      }
      throw error;
    }
  }
}

const logger = new Logger(CourseRepository.name);
