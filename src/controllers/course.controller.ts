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
  Logger,
} from '@nestjs/common';
import { CourseRequestDto } from '../dtos/course/course.request.dto';
import { CourseUpdateDto } from 'src/dtos/course/course.update.dto';
import { CourseCreateEnrollmentDto } from 'src/dtos/enrollment/course.create.enrollment.dto';
import { CourseUpdateEnrollmentDto } from 'src/dtos/enrollment/course.update.enrollment.dto';
import { EnrollmentFilterDto } from 'src/dtos/enrollment/enrollment.filter.dto';
import { CourseModuleCreateDto } from 'src/dtos/module/course.module.create.dto';
import { CourseModuleUpdateDto } from 'src/dtos/module/course.module.update.dto';
import { CourseResourceCreateDto } from 'src/dtos/resources/course.resource.create.dto';
import { CourseResourceUpdateDto } from 'src/dtos/resources/course.resource.update.dto';
import { CourseFeedbackDto } from 'src/dtos/feedback/course.feedback.dto';
import { StudentFeedbackDto } from 'src/dtos/feedback/student.feedback.dto';
import { CourseFilterDto } from 'src/dtos/course/course.filter.dto';

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
    logger.log(
      `Creating a new course with title ${requestDTO.title} and description ${requestDTO.description}`,
    );
    return this.service.createCourse(requestDTO);
  }

  /**
   * Retrieves all courses.
   * @returns An array of all courses.
   */
  @Get()
  getCourses(@Query() filters: CourseFilterDto) {
    logger.log(`Getting all courses matching: ${JSON.stringify(filters)}`);
    return this.service.findCourses(filters);
  }

  @Get('enrollments')
  async getEnrollments(@Query() filters: EnrollmentFilterDto) {
    logger.log(
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
    logger.log(`Getting course with id ${id}`);
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
    logger.log(`Updating course with ID ${id}`);
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
    logger.log(`Deleting course with ID ${id}`);
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
    logger.log(`Creating enrollment for user ${dto.userId} in course ${courseId}`);
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
    logger.log(`Getting enrollments for course with ID ${courseId}`);
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
    logger.log(`Deleting enrollment for user ${userId} in course ${courseId}`);
    return this.service.deleteEnrollment(courseId, userId);
  }

  @Get(':courseId/activities')
  async getCourseActivity(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('userId') userId: string,
  ) {
    logger.log(`Getting course ${courseId} activity for user ${userId}`);
    return this.service.getActivities(courseId, userId);
  }

  @Post(':courseId/modules')
  async createModule(
    @Param('courseId') courseId: number,
    @Body() requestDto: CourseModuleCreateDto,
  ) {
    return await this.service.createModule(courseId, requestDto);
  }

  @Get(':courseId/modules/:moduleId')
  async getCourseModule(@Param('courseId') courseId: number, @Param('moduleId') moduleId: string) {
    const module = await this.service.getCourseModule(courseId, moduleId);
    if (!module) {
      logger.warn(`The module with ID ${moduleId} was not found.`);
      throw new NotFoundException(`Module with ID ${moduleId} not found.`);
    }
    return module;
  }

  @Get(':courseId/modules')
  async getAllCourseModules(@Param('courseId') courseId: number) {
    return await this.service.getAllCourseModules(courseId);
  }

  @Patch(':courseId/modules/:moduleId')
  async updateModule(
    @Param('courseId') courseId: number,
    @Param('moduleId') moduleId: string,
    @Body() updateDto: CourseModuleUpdateDto,
  ) {
    return await this.service.updateModule(courseId, moduleId, updateDto);
  }

  @Delete(':courseId/modules/:moduleId')
  async deleteModule(
    @Param('courseId') courseId: number,
    @Param('moduleId') moduleId: string,
    @Query('userId') userId: string,
  ) {
    return await this.service.deleteModule(courseId, userId, moduleId);
  }

  @Post(':courseId/modules/:moduleId/resources')
  async createResource(
    @Param('courseId') courseId: number,
    @Param('moduleId') moduleId: string,
    @Body() requestDto: CourseResourceCreateDto,
  ) {
    return await this.service.createResource(courseId, moduleId, requestDto);
  }

  @Get(':courseId/modules/:moduleId/resources/:link')
  async getModuleResource(
    @Param('courseId') courseId: number,
    @Param('moduleId') moduleId: string,
    @Param('link') link: string,
  ) {
    const resource = await this.service.getModuleResource(
      courseId,
      moduleId,
      decodeURIComponent(link),
    );
    if (!resource) {
      logger.warn(`The resource with ID ${link} was not found.`);
      throw new NotFoundException(`Resource with ID ${link} not found.`);
    }
    return resource;
  }

  @Get(':courseId/modules/:moduleId/resources')
  async getAllModuleResources(
    @Param('courseId') courseId: number,
    @Param('moduleId') moduleId: string,
  ) {
    return await this.service.getAllModuleResources(courseId, moduleId);
  }

  @Patch(':courseId/modules/:moduleId/resources/:link')
  async updateResource(
    @Param('courseId') courseId: number,
    @Param('moduleId') moduleId: string,
    @Param('link') link: string,
    @Body() updateDto: CourseResourceUpdateDto,
  ) {
    return await this.service.updateResource(
      courseId,
      moduleId,
      decodeURIComponent(link),
      updateDto,
    );
  }

  @Delete(':courseId/modules/:moduleId/resources/:link')
  async deleteResource(
    @Param('courseId') courseId: number,
    @Param('moduleId') moduleId: string,
    @Param('link') link: string,
    @Query('userId') userId: string,
  ) {
    return await this.service.deleteResource(courseId, userId, moduleId, decodeURIComponent(link));
  }

  @Post(':courseId/enrollments/:userId/courseFeedback')
  async createCourseFeedback(
    @Param('courseId') courseId: number,
    @Param('userId') userId: string,
    @Body() feedback: CourseFeedbackDto,
  ) {
    logger.log(`Creating feedback for course ${courseId} by user ${userId}`);
    return this.service.createCourseFeedback(courseId, userId, feedback);
  }

  @Post(':courseId/enrollments/:userId/studentFeedback')
  async createStudentFeedback(
    @Param('courseId') courseId: number,
    @Param('userId') userId: string,
    @Body() feedback: StudentFeedbackDto,
  ) {
    logger.log(`Creating feedback for user ${userId} in course ${courseId}`);
    return this.service.createStudentFeedback(courseId, userId, feedback);
  }

  @Get(':courseId/enrollments/:userId/courseFeedback')
  async getCourseFeedback(@Param('courseId') courseId: number, @Param('userId') userId: string) {
    logger.log(`Getting feedback for course ${courseId} made by user ${userId}`);
    return this.service.getCourseFeedback(courseId, userId);
  }

  @Get(':courseId/enrollments/:userId/studentFeedback')
  async getStudentFeedback(@Param('courseId') courseId: number, @Param('userId') userId: string) {
    logger.log(`Getting feedback for user ${userId} in course ${courseId}`);
    return this.service.getStudentFeedback(courseId, userId);
  }
}

const logger = new Logger(CourseController.name);
