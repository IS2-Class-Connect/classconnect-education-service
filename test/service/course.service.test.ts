import { CourseService } from '../../src/services/course.service';
import { CourseRequestDto } from '../../src/dtos/course/course.request.dto';
import { CourseRepository } from 'src/repositories/course.repository';
import { CourseResponseDto } from 'src/dtos/course/course.response.dto';
import { getDatesAfterToday } from 'test/utils';
import { Activity, Enrollment, Prisma, Role } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { EnrollmentFilterDto } from 'src/dtos/enrollment/enrollment.filter.dto';
import { EnrollmentResponseDto } from 'src/dtos/enrollment/enrollments.response.dto';
import { ForbiddenUserException } from 'src/exceptions/exception.forbidden.user';

describe('CourseService', () => {
  let service: CourseService;
  let mockRepository: CourseRepository;
  const { startDate, endDate, registrationDeadline } = getDatesAfterToday();

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createEnrollment: jest.fn(),
      findCourseEnrollments: jest.fn(),
      findEnrollments: jest.fn(),
      updateEnrollment: jest.fn(),
      deleteEnrollment: jest.fn(),
      findEnrollment: jest.fn(),
      createActivityRegister: jest.fn(),
      findActivityRegisterByCourse: jest.fn(),
      createModule: jest.fn(),
      findModulesByCourse: jest.fn(),
      findModule: jest.fn(),
      updateModule: jest.fn(),
      deleteModule: jest.fn(),
    } as any;
    service = new CourseService(mockRepository);
  });

  test('Should create a Course', async () => {
    const courseRequestDTO: CourseRequestDto = {
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const expectedResponseDTO: CourseResponseDto = {
      id: 1,
      ...courseRequestDTO,
    };

    (mockRepository.create as jest.Mock).mockResolvedValue({
      ...expectedResponseDTO,
      startDate,
      endDate,
      registrationDeadline,
      createdAt: new Date(),
    });

    const foundResponseDTO = await service.createCourse(courseRequestDTO);

    expect(foundResponseDTO).toBeDefined();
    expect(foundResponseDTO).toEqual(expectedResponseDTO);
  });

  test('Should retrieve courses currently existing', async () => {
    const expectedResponseDTO1 = {
      id: 1,
      title: 'Ingeniería del software 1',
      description: 'Curso de Ingeniería del software 1, es correlativa a IS2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const expectedResponseDTO2 = {
      id: 2,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174001',
    };

    (mockRepository.findAll as jest.Mock).mockResolvedValue([
      {
        ...expectedResponseDTO1,
        startDate,
        endDate,
        registrationDeadline,
        createdAt: new Date(Date.now()),
      },
      {
        ...expectedResponseDTO2,
        startDate,
        endDate,
        registrationDeadline,
        createdAt: new Date(Date.now() - 1000),
      },
    ]);

    const foundResponseDTO = await service.findAllCourses();

    expect(foundResponseDTO).toBeDefined();
    expect(foundResponseDTO.length).toEqual(2);
    // check to be ordered by createdAt
    expect(foundResponseDTO[0]).toEqual(expectedResponseDTO1);
    expect(foundResponseDTO[1]).toEqual(expectedResponseDTO2);
  });

  test('Should retrieve the course matching the id passed', async () => {
    const expected = {
      id: 1,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };

    (mockRepository.findById as jest.Mock).mockImplementation((id: number) => {
      if (id === expected.id) {
        return Promise.resolve({
          ...expected,
          startDate,
          endDate,
          registrationDeadline,
          createdAt: new Date(),
        });
      }
      return Promise.resolve(null);
    });

    const found = await service.findCourseById(expected.id);

    expect(found).toEqual(expected);
  });

  test('Should retrieve undefined if course is not found', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(null);
    const result = await service.findCourseById(123);
    expect(result).toBeUndefined();
  });

  test('Should update a course and retrieve the updated course', async () => {
    const id = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const courseUpdateDTO = {
      title: 'Ingeniería del software 2 - Actualizado',
      description: 'Curso actualizado de Ingeniería del software 2',
      totalPlaces: 120,
    };

    const existingCourse = {
      id,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate,
      endDate: endDate,
      registrationDeadline: registrationDeadline,
      totalPlaces: 100,
      teacherId: userId,
      createdAt: new Date(),
    };

    const updatedCourse = {
      ...existingCourse,
      ...courseUpdateDTO,
    };

    const expectedResult: CourseResponseDto = {
      ...courseUpdateDTO,
      id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      teacherId: userId,
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(existingCourse);
    (mockRepository.update as jest.Mock).mockResolvedValue(updatedCourse);

    const result = await service.updateCourse(id, {
      ...courseUpdateDTO,
      userId,
    });

    expect(mockRepository.findById).toHaveBeenCalledWith(id);
    expect(mockRepository.update).toHaveBeenCalledWith(id, courseUpdateDTO);
    expect(result).toEqual(expectedResult);
  });

  test('Should throw an exception when trying to update a non existing course', async () => {
    const id = 1;
    const courseUpdateDTO = {
      title: 'Ingeniería del software 2 - Actualizado',
      description: 'Curso actualizado de Ingeniería del software 2',
      totalPlaces: 120,
      userId: '123e4567-e89b-12d3-a456-426614174000',
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(service.updateCourse(id, courseUpdateDTO)).rejects.toThrow(NotFoundException);
  });

  test('Should throw an exception when trying to update a course with a non valid user', async () => {
    const id = 1;
    const courseUpdateDTO = {
      title: 'Ingeniería del software 2 - Actualizado',
      description: 'Curso actualizado de Ingeniería del software 2',
      totalPlaces: 120,
      userId: '123e4567-e89b-12d3-a456-426614174002',
    };

    const course = {
      id,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate,
      endDate: endDate,
      registrationDeadline: registrationDeadline,
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: new Date(),
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(course);
    (mockRepository.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(service.updateCourse(id, courseUpdateDTO)).rejects.toThrow(ForbiddenUserException);
  });

  test('Should delete an existing course', async () => {
    const id = 1;

    const courseData = {
      id,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate,
      endDate: endDate,
      registrationDeadline: registrationDeadline,
      createdAt: new Date(),
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
      totalPlaces: 100,
    };

    const expected: CourseResponseDto = {
      id,
      title: courseData.title,
      description: courseData.description,
      startDate: courseData.startDate.toISOString(),
      endDate: courseData.endDate.toISOString(),
      registrationDeadline: courseData.registrationDeadline.toISOString(),
      totalPlaces: courseData.totalPlaces,
      teacherId: courseData.teacherId,
    };

    (mockRepository.delete as jest.Mock).mockResolvedValue(courseData);

    const result = await service.deleteCourse(id);

    expect(mockRepository.delete).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  test('Should return null when trying to delete a course', async () => {
    const id = 1;

    (mockRepository.findById as jest.Mock).mockResolvedValue(null);

    expect(await service.deleteCourse(id)).toBeNull();
  });

  test('Should create an enrollement', async () => {
    const courseId = 1;
    const courseCreateEnrollment = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      role: Role.STUDENT,
    };

    const expected: Enrollment = {
      ...courseCreateEnrollment,
      courseId,
      favorite: false,
    };

    (mockRepository.createEnrollment as jest.Mock).mockImplementation(
      (data: Prisma.EnrollmentUncheckedCreateInput) => ({
        ...data,
        favorite: false,
      }),
    );

    const result = await service.createEnrollment(courseId, courseCreateEnrollment);

    expect(result).toEqual(expected);
  });

  test('Should throw an exception when trying to create an enrollment on a non existing course', async () => {
    const courseId = 1;
    const courseCreateEnrollment = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      role: Role.STUDENT,
    };

    (mockRepository.createEnrollment as jest.Mock).mockImplementation(() => {
      throw new NotFoundException('Course not found');
    });

    await expect(service.createEnrollment(courseId, courseCreateEnrollment)).rejects.toThrow(
      NotFoundException,
    );
  });

  test('Should retrieve the existing enrollments of a specific course', async () => {
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

    const mockedCourse = {
      courseId,
      title: '',
      description: '',
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174010',
      startDate: new Date(),
      endDate: new Date(),
      registrationDeadline: new Date(),
      createdAt: new Date(),
    };
    (mockRepository.findById as jest.Mock).mockImplementation((id: number) =>
      id == courseId ? mockedCourse : null,
    );
    (mockRepository.findCourseEnrollments as jest.Mock).mockImplementation((id: number) =>
      enrollments.filter((enrollment) => enrollment.courseId === id),
    );

    const result = await service.getCourseEnrollments(courseId);

    expect(mockRepository.findById).toHaveBeenCalledWith(courseId);
    expect(mockRepository.findCourseEnrollments).toHaveBeenCalledWith(courseId);
    expect(result).toEqual(expected);
  });

  test('Should retrieve the existing enrollments matching the values of a specific filter', async () => {
    const courseId1 = 1;
    const courseId2 = 2;
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const enrollment1 = {
      courseId: courseId1,
      userId,
      role: Role.STUDENT,
      favorite: false,
    };
    const enrollment2 = {
      courseId: courseId2,
      userId,
      role: Role.ASSISTANT,
      favorite: false,
    };

    const mockedCourse1 = {
      id: courseId1,
      title: 'Course 1',
      description: 'This is a mock of course 1',
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174010',
      startDate: new Date(),
      endDate: new Date(),
      registrationDeadline: new Date(),
      createdAt: new Date(),
    };
    const mockedCourse2 = {
      id: courseId1,
      title: 'Course 2',
      description: 'This is a mock of course 2',
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174010',
      startDate: new Date(),
      endDate: new Date(),
      registrationDeadline: new Date(),
      createdAt: new Date(),
    };

    const filter: EnrollmentFilterDto = { userId };

    (mockRepository.findEnrollments as jest.Mock).mockResolvedValue([
      {
        ...enrollment1,
        course: mockedCourse1,
      },
      {
        ...enrollment2,
        course: mockedCourse2,
      },
    ]);

    const expected: EnrollmentResponseDto[] = [
      {
        userId,
        role: enrollment1.role,
        course: {
          id: mockedCourse1.id,
          title: mockedCourse1.title,
        },
      },
      {
        userId,
        role: enrollment2.role,
        course: {
          id: mockedCourse2.id,
          title: mockedCourse2.title,
        },
      },
    ];

    const result = await service.getEnrollments(filter);

    expect(mockRepository.findEnrollments).toHaveBeenCalledWith(filter);
    expect(result).toEqual(expected);
  });

  test('Should throw an exception when trying to get an enrollment from a non existing course', async () => {
    const courseId = 1;

    (mockRepository.findById as jest.Mock).mockResolvedValue(undefined);

    await expect(service.getCourseEnrollments(courseId)).rejects.toThrow(NotFoundException);
  });

  test('Should update an enrollment and retrieve the updated enrollment', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174010';
    const updateEnrollementDto = {
      favorite: true,
    };

    const expected = {
      courseId,
      userId,
      role: Role.STUDENT,
      ...updateEnrollementDto,
    };

    (mockRepository.updateEnrollment as jest.Mock).mockResolvedValue(expected);

    const result = await service.updateEnrollment(courseId, userId, updateEnrollementDto);

    expect(mockRepository.updateEnrollment).toHaveBeenCalledWith(
      courseId,
      userId,
      updateEnrollementDto,
    );
    expect(result).toEqual(expected);
  });

  test('Should throw an exception when trying to delete an enrollment from a non existing course', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    (mockRepository.findById as jest.Mock).mockResolvedValue(undefined);

    await expect(service.deleteEnrollment(courseId, userId)).rejects.toThrow(NotFoundException);
  });

  test('Should throw an exception when trying to update a non existing enrollment', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const updateEnrollementDto = {
      favorite: false,
    };

    (mockRepository.updateEnrollment as jest.Mock).mockImplementation(() => {
      throw new NotFoundException(`Enrollment for user ${userId} in course ${courseId} not found.`);
    });

    await expect(service.updateEnrollment(courseId, userId, updateEnrollementDto)).rejects.toThrow(
      NotFoundException,
    );
  });

  test('Should throw an exception when trying to delete a non existing enrollment', async () => {
    const courseIdExt = 1;
    const userIdExt = '123e4567-e89b-12d3-a456-426614174001';

    (mockRepository.findById as jest.Mock).mockResolvedValue('dummy value');

    (mockRepository.deleteEnrollment as jest.Mock).mockImplementation(
      (courseId: number, userId: string) => {
        if (courseId == courseIdExt && userId == userIdExt) {
          throw new NotFoundException(
            `Enrollment for user ${userId} in course ${courseId} not found.`,
          );
        }
      },
    );

    await expect(service.deleteEnrollment(courseIdExt, userIdExt)).rejects.toThrow();
    expect(mockRepository.deleteEnrollment).toHaveBeenCalledWith(courseIdExt, userIdExt);
  });

  test('Should get the activity register of an specified course', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const course = {
      id: courseId,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate,
      endDate: endDate,
      registrationDeadline: registrationDeadline,
      totalPlaces: 100,
      teacherId: userId,
      createdAt: new Date(),
    };

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

    (mockRepository.findById as jest.Mock).mockResolvedValue(course);
    (mockRepository.findActivityRegisterByCourse as jest.Mock).mockResolvedValue(expected);

    const result = await service.getActivities(courseId, userId);

    expect(mockRepository.findActivityRegisterByCourse).toHaveBeenCalledWith(courseId);
    expect(result).toBe(expected);
  });

  test('Should throw an exception when a forbidden user tries to get the register activity of a course', async () => {
    const courseId = 1;
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const course = {
      id: courseId,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate,
      endDate: endDate,
      registrationDeadline: registrationDeadline,
      totalPlaces: 100,
      teacherId,
      createdAt: new Date(),
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(course);

    await expect(service.getActivities(courseId, userId)).rejects.toThrow(ForbiddenUserException);
  });

  test('Should create a course module with user being the teacher or an assistant (not any user)', async () => {
    const courseId = 1;
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const createDto = {
      userId,
      title: 'Module 1',
      description: 'Description of module 1',
      order: 0,
    };

    const course = {
      id: courseId,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
      startDate: startDate,
      endDate: endDate,
      registrationDeadline: registrationDeadline,
      totalPlaces: 100,
      teacherId: userId,
      createdAt: new Date(),
    };

    const expected = {
      id: '111e4585-e89b-12d3-a456-426614173512',
      courseId,
      title: createDto.title,
      description: createDto.description,
      order: createDto.order,
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(course);
    (mockRepository.createModule as jest.Mock).mockResolvedValue(expected);

    const result = await service.createModule(courseId, createDto);

    expect(mockRepository.findById).toHaveBeenCalledWith(courseId);
    expect(mockRepository.createModule).toHaveBeenCalledWith({
      courseId,
      title: createDto.title,
      description: createDto.description,
      order: createDto.order,
    });
    expect(result).toBe(expected);

    const otherDto = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Module 2',
      description: 'Description of module 2',
      order: 0,
    };

    await expect(service.createModule(courseId, otherDto)).rejects.toThrow(ForbiddenUserException);
  });

  test('Should get all modules of a course', async () => {
    const courseId = 1;
    const expected = [
      {
        id: '111e4585-e89b-12d3-a456-426614173512',
        courseId,
        title: 'Module 1',
        description: 'Description of module 1',
        order: 0,
      },
      {
        id: '111e4585-e89b-12d3-a456-426614173513',
        courseId,
        title: 'Module 2',
        description: 'Description of module 2',
        order: 100,
      },
    ];

    (mockRepository.findById as jest.Mock).mockResolvedValue({ id: courseId });
    (mockRepository.findModulesByCourse as jest.Mock).mockResolvedValue(expected);

    expect(await service.getAllCourseModules(courseId)).toBe(expected);
    expect(mockRepository.findModulesByCourse).toHaveBeenCalledWith(courseId);
  });

  test('Should get a specified module of a course', async () => {
    const courseId = 1;
    const id = '111e4585-e89b-12d3-a456-426614173512';
    const expected = {
      id,
      courseId,
      title: 'Module 1',
      description: 'Description of module 1',
      order: 0,
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue({ id: courseId });
    (mockRepository.findModule as jest.Mock).mockResolvedValue(expected);

    expect(await service.getCourseModule(courseId, id)).toBe(expected);
    expect(mockRepository.findModule).toHaveBeenCalledWith(id);
  });

  test('Should update a specified module of a course with user being the teacher or an assistant (not any user)', async () => {
    const courseId = 1;
    const id = '111e4585-e89b-12d3-a456-426614173512';
    const updateDto = {
      title: 'Module updated',
      order: 200,
      userId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const { userId, ...updateData } = updateDto;
    const expected = {
      id,
      courseId,
      description: 'Description of module 1',
      ...updateDto,
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue({ teacherId: userId });
    (mockRepository.updateModule as jest.Mock).mockResolvedValue(expected);

    expect(await service.updateCourseModule(courseId, id, updateDto)).toBe(expected);
    expect(mockRepository.updateModule).toHaveBeenCalledWith(id, updateData);

    const otherDto = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Module second update',
    };

    await expect(service.updateCourseModule(courseId, id, otherDto)).rejects.toThrow(
      ForbiddenUserException,
    );
  });

  test('Should delete a specified module of a course with user being the teacher or an assistant (not any user)', async () => {
    const courseId = 1;
    const id = '111e4585-e89b-12d3-a456-426614173512';
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const expected = {
      id,
      courseId,
      title: 'Module 1',
      description: 'Description of module 1',
      order: 0,
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue({ teacherId: userId });
    (mockRepository.deleteModule as jest.Mock).mockResolvedValue(expected);

    expect(await service.deleteCourseModule(courseId, userId, id)).toBe(expected);
    expect(mockRepository.deleteModule).toHaveBeenCalledWith(id);

    const forbiddenUserId = '123e4567-e89b-12d3-a456-426614174001';
    await expect(service.deleteCourseModule(courseId, forbiddenUserId, id)).rejects.toThrow(
      ForbiddenUserException,
    );
  });
});
