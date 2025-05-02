import { NotFoundException } from '@nestjs/common';
import { CourseController } from '../../src/controllers/course.controller';
import { CourseService } from '../../src/services/course.service';
import { getDatesAfterToday } from 'test/utils';

describe('CourseController', () => {
  let controller: CourseController;
  let mockService: CourseService;
  const { startDate, endDate, registrationDeadline } = getDatesAfterToday();

  beforeEach(() => {
    mockService = {
      findAllCourses: jest.fn(),
      findCourseById: jest.fn(),
      createCourse: jest.fn(),
      deleteCourse: jest.fn(),
    } as any;
    controller = new CourseController(mockService);
  });

  test('Should retreive a new Course instance', async () => {
    const courseDTO = {
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
    };
    const mockCreatedCourse = {
      id: 1,
      ...courseDTO,
      createdAt: new Date(),
      startDate,
      endDate,
      registrationDeadline,
    };

    (mockService.createCourse as jest.Mock).mockResolvedValue(mockCreatedCourse);

    const result = await controller.createCourse(courseDTO);

    expect(result).toEqual(mockCreatedCourse);
    expect(mockService.createCourse).toHaveBeenCalledWith(courseDTO);
  });

  test('Should retreive all courses', async () => {
    const mockCourses = [
      {
        id: 1,
        title: 'Ingeniería del software 2',
        description: 'Curso de Ingeniería del software 2',
        startDate,
        endDate,
        registrationDeadline,
        totalPlaces: 100,
        createdAt: new Date(),
      },
      {
        id: 2,
        title: 'Ingeniería del software 1',
        description: 'Curso de Ingeniería del software 1, es correlativa a IS2',
        startDate,
        endDate,
        registrationDeadline,
        totalPlaces: 100,
        createdAt: new Date(),
      },
    ];
    (mockService.findAllCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await controller.getAllCourses();

    expect(result).toEqual(mockCourses);
    expect(mockService.findAllCourses).toHaveBeenCalled();
  });

  test('Should retreive an existing course', async () => {
    const mockCourse = {
      id: 1,
      title: 'IS2',
      description: 'Curso',
      createdAt: new Date(),
      startDate,
      endDate,
      registrationDeadline,
      totalPlaces: 100,
    };
    (mockService.findCourseById as jest.Mock).mockResolvedValue(mockCourse);

    const result = await controller.getCourse(1);

    expect(result).toEqual(mockCourse);
    expect(mockService.findCourseById).toHaveBeenCalledWith(1);
  });

  test('Should throw a NotFoundError for looking for a non existing course', async () => {
    (mockService.findCourseById as jest.Mock).mockResolvedValue(undefined);

    await expect(controller.getCourse(999)).rejects.toThrow(NotFoundException);
  });
});
