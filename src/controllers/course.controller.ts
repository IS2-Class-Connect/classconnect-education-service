import 'reflect-metadata';
import { CourseService } from '../services/course.service';
import {
  Get,
  Post,
  Controller,
  Param,
  Body,
  HttpCode,
  Delete,
  HttpStatus,
  NotFoundException,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CourseRequestDto } from '../dtos/course.request.dto';
import { logger } from '../logger';
import { CourseUpdateDto } from 'src/dtos/course.update.dto';
import { CourseCreateEnrollmentDto } from 'src/dtos/course.create.enrollment';
import { CourseUpdateEnrollmentDto } from 'src/dtos/course.update.enrollment';
import { EnrollmentFilterDto } from 'src/dtos/enrollment.filter';

/**
 * Controller class for handling HTTP requests related to courses.
 */
@Controller('/courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  /**
   * Creates a new course.
   * @param requestDTO - The validated data transfer object from the request body.
   * @returns The newly created course.
   */
  @HttpCode(HttpStatus.CREATED)
  @Post()
  createCourse(@Body() requestDTO: CourseRequestDto) {
    logger.info(
      `Creating a new course with title ${requestDTO.title} and description ${requestDTO.description}`,
    );
    return this.service.createCourse(requestDTO);
  }

  /**
   * Retrieves all courses.
   * @returns An array of all courses.
   */
  @Get()
  getAllCourses() {
    logger.info('Getting all courses');
    return this.service.findAllCourses();
  }

  @Get('enrollments')
  async getEnrollments(@Query() filters: EnrollmentFilterDto) {
    logger.info(
      `Getting enrollments${filters.role || filters.userId ? ` matching${filters.role ? ` role "${filters.role}"` : ''}${filters.role && filters.userId ? ' and' : ''}${filters.userId ? ` user "${filters.userId}"` : ''}` : ' with no filters'}.`,
    );
    return this.service.getEnrollments(filters);
  }

  /**
   * Retrieves a specific course by ID.
   * @param id - The ID of the course to retrieve.
   * @returns The course if found.
   * @throws NotFoundError if the course does not exist.
   */
  @Get(':id')
  async getCourse(@Param('id', ParseIntPipe) id: number) {
    logger.info(`Getting course with id ${id}`);
    const course = await this.service.findCourseById(id);
    if (!course) {
      logger.warn(`Course with ID ${id} not found.`);
      throw new NotFoundException(`The course with ID ${id} was not found.`);
    }
    return course;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  /**
   * Updates an existing course with the provided data.
   *
   * @param id - The unique identifier of the course to be updated.
   * @param updateDTO - The data transfer object containing the updated course information.
   * @returns The updated course data.
   */
  async updateCourse(@Param('id') id: number, @Body() updateDTO: CourseUpdateDto) {
    logger.info(`Updating course with ID ${id}`);
    const updateCourse = await this.service.updateCourse(id, updateDTO);
    return updateCourse;
  }

  /**
   * Deletes a specific course by ID.
   * @param id - The ID of the course to delete.
   * @throws NotFoundError if the course does not exist.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('id') id: number) {
    logger.info(`Deleting course with ID ${id}`);
    if (!(await this.service.deleteCourse(id))) {
      logger.warn(`Course with ID ${id} not found.`);
      throw new NotFoundException(`Course with ID ${id} does not exist.`);
    }
  }

  /**
   * Adds a user enrollment to a specific course.
   * @param courseId - The ID of the course to which the participant will be added.
   * @param dto - The data transfer object containing enrollment information.
   * @throws NotFoundException if the course does not exist.
   * @throws ConflictException if the user is already enrolled in the course.
   * @throws BadRequestException if the enrollment data is invalid.
   * @returns The enrollment details of the participant.
   */
  @Post(':courseId/enrollments')
  async createEnrollment(
    @Param('courseId') courseId: number,
    @Body() dto: CourseCreateEnrollmentDto,
  ) {
    return this.service.createEnrollment(courseId, dto);
  }

  /**
   * Retrieves all enrollments for a specific course.
   * @param courseId - The ID of the course whose enrollments are to be retrieved.
   * @returns An array of enrollments for the specified course.
   * @throws NotFoundError if the course does not exist.
   */
  @Get(':courseId/enrollments')
  async getCourseEnrollments(@Param('courseId') courseId: number) {
    logger.info(`Getting enrollments for course with ID ${courseId}`);
    return await this.service.getCourseEnrollments(courseId);
  }

  @Patch(':courseId/enrollments/:userId')
  /**
   * Updates the enrollment of a user in a specific course.
   *
   * @param courseId - The ID of the course from which the enrollment belongs.
   * @param userId - The ID of the user linked to the enrollment.
   * @param updateEnrollmentDto - The data transfer object containing enrollment information.
   * @throws BadRequestException if the enrollment data is invalid.
   * @throws NotFoundError if the enrollment trying to be updated does not exist.
   * @returns A promise that resolves when the enrollment is successfully updated.
   */
  async updateEnrollment(
    @Param('courseId') courseId: number,
    @Param('userId') userId: string,
    @Body() updateEnrollmentDto: CourseUpdateEnrollmentDto,
  ) {
    return this.service.updateEnrollment(courseId, userId, updateEnrollmentDto);
  }

  @Delete(':courseId/enrollments/:userId')
  /**
   * Deletes the enrollment of a user in a specific course.
   *
   * @param courseId - The ID of the course from which the user will be unenrolled.
   * @param userId - The ID of the user whose enrollment will be deleted.
   * @throws NotFoundError if the enrollment trying to be deleted does not exist.
   * @returns A promise that resolves when the enrollment is successfully deleted.
   */
  async deleteEnrollment(@Param('courseId') courseId: number, @Param('userId') userId: string) {
    logger.info(`Deleting enrollment for user ${userId} in course ${courseId}`);
    return this.service.deleteEnrollment(courseId, userId);
  }

  @Get(':courseId/activities')
  async getCourseActivity(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('userId') userId: string,
  ) {
    logger.info(`Getting course ${courseId} activity for user ${userId}`);
    return this.service.getActivities(courseId, userId);
  }
}
