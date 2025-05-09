import { NotFoundException } from '@nestjs/common';
import { CourseController } from '../../src/controllers/course.controller';
import { CourseService } from '../../src/services/course.service';
import { getDatesAfterToday } from 'test/utils';
import { Enrollment, Role } from '@prisma/client';

describe('CourseController', () => {
  let controller: CourseController;
  let mockService: CourseService;
  const { startDate, endDate, registrationDeadline } = getDatesAfterToday();

  beforeEach(() => {
    mockService = {
      findAllCourses: jest.fn(),
      findCourseById: jest.fn(),
      createCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      createEnrollment: jest.fn(),
      getCourseEnrollments: jest.fn(),
      deleteEnrollment: jest.fn(),
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
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
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
        teacherId: '123e4567-e89b-12d3-a456-426614174000',
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
        teacherId: '123e4567-e89b-12d3-a456-426614174001',
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
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
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

  test('Should update an existing course', async () => {
    const id = 1;

    const courseUpdateDTO = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    const expected = {
      id,
      ...courseUpdateDTO,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: new Date(),
    };

    (mockService.updateCourse as jest.Mock).mockResolvedValue(expected);

    const result = await controller.updateCourse(id, courseUpdateDTO);

    expect(result).toEqual(expected);
    expect(mockService.updateCourse).toHaveBeenCalledWith(id, courseUpdateDTO);
  });

  test('Should throw a NotFoundError when updating a non-existing course', async () => {
    const courseUpdateDTO = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    (mockService.updateCourse as jest.Mock).mockResolvedValue(undefined);

    await expect(controller.updateCourse(999, courseUpdateDTO)).rejects.toThrow(NotFoundException);
  });

  test('Should retrieve an enrollment to a course', async () => {
    const courseId = 1;
    const enrollmentDTO = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      role: Role.STUDENT,
    };

    const expected = {
      courseId,
      ...enrollmentDTO,
      favorite: false,
    };

    (mockService.createEnrollment as jest.Mock).mockResolvedValue(expected);

    const result = await controller.createEnrollment(courseId, enrollmentDTO);

    expect(result).toEqual(expected);
    expect(mockService.createEnrollment).toHaveBeenCalledWith(courseId, enrollmentDTO);
  });

  test('Should retrieve all enrollments for a course', async () => {
    const courseId = 1;
    const enrollments = [
      {
        courseId,
        userId: '123e4567-e89b-12d3-a456-426614174001',
        role: Role.STUDENT,
        favorite: false,
      },
      {
        courseId,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        role: Role.STUDENT,
        favorite: true,
      },
      {
        courseId: 2,
        userId: '123e4567-e89b-12d3-a456-426614174001',
        role: Role.STUDENT,
        favorite: false,
      },
    ];

    const expected: Enrollment[] = [enrollments[0], enrollments[1]];

    (mockService.getCourseEnrollments as jest.Mock).mockImplementation((id: number) =>
      enrollments.filter((enrollment) => enrollment.courseId === id),
    );

    const result = await controller.getCourseEnrollments(courseId);

    expect(result).toEqual(expected);
    expect(mockService.getCourseEnrollments).toHaveBeenCalledWith(courseId);
  });

  test('Should delete an enrollment from a course', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const enrollmentDTO = {
      userId,
      role: Role.STUDENT,
    };

    const expected = {
      courseId,
      ...enrollmentDTO,
      favorite: false,
    };

    (mockService.deleteEnrollment as jest.Mock).mockResolvedValue(expected);

    const result = await controller.deleteEnrollment(courseId, userId);

    expect(result).toEqual(expected);
    expect(mockService.deleteEnrollment).toHaveBeenCalledWith(courseId, userId);
  });
});
