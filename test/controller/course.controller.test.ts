import { NotFoundException } from '@nestjs/common';
import { CourseController } from '../../src/controllers/course.controller';
import { CourseService } from '../../src/services/course.service';
import { getDatesAfterToday } from 'test/utils';
import { Activity, Enrollment, Role } from '@prisma/client';
import { EnrollmentFilterDto } from 'src/dtos/enrollment/enrollment.filter.dto';

describe('CourseController', () => {
  let controller: CourseController;
  let mockService: CourseService;
  const { startDate, endDate, registrationDeadline } = getDatesAfterToday();

  beforeEach(() => {
    mockService = {
      findCourses: jest.fn(),
      findCourseById: jest.fn(),
      createCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      createEnrollment: jest.fn(),
      getCourseEnrollments: jest.fn(),
      getEnrollments: jest.fn(),
      updateEnrollment: jest.fn(),
      deleteEnrollment: jest.fn(),
      getActivities: jest.fn(),
      getCourseModule: jest.fn(),
      getModuleResource: jest.fn(),
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
    (mockService.findCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await controller.getCourses({});

    expect(result).toEqual(mockCourses);
    expect(mockService.findCourses).toHaveBeenCalled();
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

  test('Should throw a Not Found Exception for looking for a non existing course', async () => {
    (mockService.findCourseById as jest.Mock).mockResolvedValue(undefined);

    await expect(controller.getCourse(999)).rejects.toThrow(NotFoundException);
  });

  test('Should update an existing course', async () => {
    const id = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const courseUpdateData = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    const expected = {
      id,
      ...courseUpdateData,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: userId,
      createdAt: new Date(),
    };

    (mockService.updateCourse as jest.Mock).mockResolvedValue(expected);

    const result = await controller.updateCourse(id, { ...courseUpdateData, userId });

    expect(result).toEqual(expected);
    expect(mockService.updateCourse).toHaveBeenCalledWith(id, { ...courseUpdateData, userId });
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

  test('Should retrieve the enrollments matching a specific filter', async () => {
    const courseId1 = 1;
    const courseId2 = 2;
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const expected = [
      {
        userId,
        role: Role.STUDENT,
        course: {
          id: courseId1,
          title: 'Course 1',
        },
      },
      {
        userId,
        role: Role.ASSISTANT,
        course: {
          id: courseId2,
          title: 'Course 2',
        },
      },
    ];

    const filter: EnrollmentFilterDto = { userId };

    (mockService.getEnrollments as jest.Mock).mockResolvedValue(expected);

    const result = await controller.getEnrollments(filter);

    expect(result).toEqual(expected);
    expect(mockService.getEnrollments).toHaveBeenCalledWith(filter);
  });

  test('Should update an enrollment', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const enrollmentDTO = {
      favorite: true,
      role: Role.STUDENT,
    };

    const expected = {
      courseId,
      userId,
      ...enrollmentDTO,
    };

    (mockService.updateEnrollment as jest.Mock).mockResolvedValue(expected);

    const result = await controller.updateEnrollment(courseId, userId, enrollmentDTO);

    expect(mockService.updateEnrollment).toHaveBeenCalledWith(courseId, userId, enrollmentDTO);
    expect(result).toEqual(expected);
  });

  test('Should delete an enrollment from a course', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const expected = {
      courseId,
      userId,
      role: Role.STUDENT,
      favorite: false,
    };

    (mockService.deleteEnrollment as jest.Mock).mockResolvedValue(expected);

    const result = await controller.deleteEnrollment(courseId, userId);

    expect(result).toEqual(expected);
    expect(mockService.deleteEnrollment).toHaveBeenCalledWith(courseId, userId);
  });

  test('Should get the activity register of an specified course', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const expected = [
      {
        courseId,
        userId: '123e4567-e89b-12d3-a456-426614174001',
        id: '123e4567-e89b-12d3-a456-426614175555',
        activity: Activity.EDIT_COURSE,
        createdAt: yesterday,
      },
      {
        courseId,
        userId: '123e4567-e89b-12d3-a456-426614174001',
        id: '123e4567-e89b-12d3-a456-426614175556',
        activity: Activity.ADD_EXAM,
        createdAt: yesterday,
      },
    ];

    (mockService.getActivities as jest.Mock).mockResolvedValue(expected);

    const result = await controller.getCourseActivity(courseId, userId);

    expect(mockService.getActivities).toHaveBeenCalledWith(courseId, userId);
    expect(result).toBe(expected);
  });

  test('Should throw a Not Found Exception for looking for a non existing module', async () => {
    const courseId = 1;
    const moduleId = '111e4585-e89b-12d3-a456-426614173512';

    (mockService.getCourseModule as jest.Mock).mockResolvedValue(null);

    await expect(controller.getCourseModule(courseId, moduleId)).rejects.toThrow(NotFoundException);
    expect(mockService.getCourseModule).toHaveBeenCalledWith(courseId, moduleId);
  });

  test('Should throw a Not Found Exception for looking for a non existing resource', async () => {
    const courseId = 1;
    const moduleId = '111e4585-e89b-12d3-a456-426614173512';
    const link = 'https://example.com/resource.pdf';

    (mockService.getModuleResource as jest.Mock).mockResolvedValue(null);

    await expect(
      controller.getModuleResource(courseId, moduleId, encodeURIComponent(link)),
    ).rejects.toThrow(NotFoundException);
    expect(mockService.getModuleResource).toHaveBeenCalledWith(courseId, moduleId, link);
  });
});
