import { CourseService } from '../../src/services/course.service';
import { CourseRequestDto } from '../../src/dtos/course.request.dto';
import { CourseRepository } from 'src/repositories/course.repository';
import { CourseResponseDto } from 'src/dtos/course.response.dto';
import { getDatesAfterToday } from 'test/utils';

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

  test('Should retreive courses currently existing', async () => {
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

  test('Should retreive the course matching the id passed', async () => {
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

  test('Should retreive undefined if course is not found', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(null);
    const result = await service.findCourseById(123);
    expect(result).toBeUndefined();
  });

  test('Should update a course and return the updated course', async () => {
    const id = 1;
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
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
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
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };

    (mockRepository.findById as jest.Mock).mockResolvedValue(existingCourse);
    (mockRepository.update as jest.Mock).mockResolvedValue(updatedCourse);

    const result = await service.updateCourse(id, courseUpdateDTO);

    expect(mockRepository.findById).toHaveBeenCalledWith(id);
    expect(mockRepository.update).toHaveBeenCalledWith(id, courseUpdateDTO);
    expect(result).toEqual(expectedResult);
  });
});
