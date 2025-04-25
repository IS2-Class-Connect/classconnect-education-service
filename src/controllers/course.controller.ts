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
} from '@nestjs/common';
import { CourseRequestDTO } from '../dtos/course.request.dto';
import { logger } from '../logger';

/**
 * Controller class for handling HTTP requests related to courses.
 */
@Controller('/courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  /**
   * Sets a custom service.
   * @param service - The service instance to use.
   */
  // setService(service: CourseService) {
  //   this.service = service;
  // }

  /**
   * Creates a new course.
   * @param requestDTO - The validated data transfer object from the request body.
   * @returns The newly created course.
   */
  @HttpCode(HttpStatus.CREATED)
  @Post()
  createCourse(@Body() requestDTO: CourseRequestDTO) {
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

  /**
   * Retrieves a specific course by ID.
   * @param id - The ID of the course to retrieve.
   * @returns The course if found.
   * @throws NotFoundError if the course does not exist.
   */
  @Get(':id')
  async getCourse(@Param('id') id: number) {
    logger.info(`Getting course with id ${id}`);
    const course = await this.service.findCourseById(id);
    if (!course) {
      logger.warn(`Course with ID ${id} not found.`);
      throw new NotFoundException(`The course with ID ${id} was not found.`);
    }
    return course;
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
}
