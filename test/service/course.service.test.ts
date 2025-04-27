import { CourseService } from '../../src/services/course.service';
import { CourseRequestDTO } from '../../src/dtos/course.request.dto';
import { logger } from '../../src/logger';
import { CourseRepository } from 'src/repositories/course.repository';

describe('CourseService', () => {
  let service: CourseService;
  let mockRepository: CourseRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new CourseService(mockRepository);
  });

  test('Should create a Course', async () => {
    const courseData: CourseRequestDTO = {
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
    };

    (mockRepository.create as jest.Mock).mockResolvedValue({
      id: 1,
      createdAt: new Date(),
      ...courseData,
    });

    const newCourse = await service.createCourse(courseData);

    expect(newCourse).toBeDefined();
    expect(newCourse.title).toBe('Ingeniería del software 2');
    expect(newCourse.description).toBe('Curso de Ingeniería del software 2');
  });

  test('Should retreive courses currently existing', async () => {
    const expectedResponse1 = {
      id: 1,
      title: 'Ingeniería del software 1',
      description: 'Curso de Ingeniería del software 1, es correlativa a IS2',
    };

    const expectedResponse2 = {
      id: 2,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
    };

    (mockRepository.findAll as jest.Mock).mockResolvedValue([
      { createdAt: new Date(), ...expectedResponse1 },
      { createdAt: new Date(), ...expectedResponse2 },
    ]);

    const courses = await service.findAllCourses();

    expect(courses).toBeDefined();

    const coursesChecked = [false, false];
    for (const course of courses) {
      if (course.id == expectedResponse1.id) {
        expect(course).toEqual(expectedResponse1);
        coursesChecked[0] = true;
      } else if (course.id == expectedResponse2.id) {
        expect(course).toEqual(expectedResponse2);
        coursesChecked[1] = true;
      }
    }
    if (!(coursesChecked[0] && coursesChecked[1])) {
      logger.debug('Service.findAllCourses() did not retreive every course created before.');
      expect(true).toEqual(false);
    }
  });

  test('Should retreive the course matching the id passed', async () => {
    const expected = {
      id: 1,
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
    };

    (mockRepository.findById as jest.Mock).mockImplementation((id: number) => {
      if (id === expected.id) {
        return Promise.resolve({ createdAt: new Date(), ...expected });
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
});
