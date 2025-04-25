import { NotFoundException } from '@nestjs/common';
import { CourseController } from '../../src/controllers/course.controller';
import { CourseService } from '../../src/services/course.service';

describe('CourseController', () => {
  let controller: CourseController;
  let mockService: CourseService;

  beforeEach(() => {
    mockService = {
      findAllCourses: jest.fn(),
      findCourseById: jest.fn(),
      createCourse: jest.fn(),
    } as any;
    controller = new CourseController(mockService);
  });

  test('Should retreive a new Course instance', () => {
    const courseDTO = {
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
    };
    const mockCreatedCourse = { id: 1, ...courseDTO };

    (mockService.createCourse as jest.Mock).mockReturnValue(mockCreatedCourse);

    const result = controller.createCourse(courseDTO);

    expect(result).toEqual(mockCreatedCourse);
    expect(mockService.createCourse).toHaveBeenCalledWith(courseDTO);
  });

  test('Should retreive all courses', () => {
    const mockCourses = [
      {
        id: 1,
        title: 'Ingeniería del software 2',
        description: 'Curso de Ingeniería del software 2',
      },
      {
        id: 2,
        title: 'Ingeniería del software 1',
        description: 'Curso de Ingeniería del software 1, es correlativa a IS2',
      },
    ];
    (mockService.findAllCourses as jest.Mock).mockReturnValue(mockCourses);

    const result = controller.getAllCourses();

    expect(result).toEqual(mockCourses);
    expect(mockService.findAllCourses).toHaveBeenCalled();
  });

  test('Should retreive an existing course', () => {
    const mockCourse = { id: 1, title: 'IS2', description: 'Curso' };
    (mockService.findCourseById as jest.Mock).mockReturnValue(mockCourse);

    const result = controller.getCourse(1);

    expect(result).toEqual(mockCourse);
    expect(mockService.findCourseById).toHaveBeenCalledWith(1);
  });

  test('Should throw a NotFoundError for looking for a non existing course', () => {
    (mockService.findCourseById as jest.Mock).mockReturnValue(undefined);

    expect(() => controller.getCourse(999)).toThrow(NotFoundException);
  });
});
