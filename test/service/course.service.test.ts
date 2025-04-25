import { CourseService } from '../../src/services/course.service';
import { CourseRequestDTO } from '../../src/dtos/course.request.dto';
import { logger } from '../../src/logger';

describe('CourseService', () => {
  let service: CourseService;

  beforeEach(() => {
    service = new CourseService();
  });

  test('Should create a Course', () => {
    const courseData: CourseRequestDTO = {
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
    };

    const newCourse = service.createCourse(courseData);

    expect(newCourse).toBeDefined();
    expect(newCourse.title).toBe('Ingeniería del software 2');
    expect(newCourse.description).toBe('Curso de Ingeniería del software 2');
  });

  test('Should retreive courses currently existing', () => {
    const courseData1: CourseRequestDTO = {
      title: 'Ingeniería del software 1',
      description: 'Curso de Ingeniería del software 1, es correlativa a IS2',
    };

    const courseData2: CourseRequestDTO = {
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
    };

    const course1 = service.createCourse(courseData1);
    const course2 = service.createCourse(courseData2);

    const courses = service.findAllCourses();

    expect(courses).toBeDefined();

    const coursesChecked = [false, false];
    for (const course of courses) {
      if (course.id == course1.id) {
        expect(course).toEqual(course1);
        coursesChecked[0] = true;
      } else if (course.id == course2.id) {
        expect(course).toEqual(course2);
        coursesChecked[1] = true;
      }
    }
    if (!(coursesChecked[0] && coursesChecked[1])) {
      logger.debug('Service.findAllCourses() did not retreive every course created before.');
      expect(true).toEqual(false);
    }
  });

  test('Should retreive the course matching the id passed', () => {
    const courseData: CourseRequestDTO = {
      title: 'Ingeniería del software 2',
      description: 'Curso de Ingeniería del software 2',
    };

    const created = service.createCourse(courseData);

    const found = service.findCourseById(created.id);

    expect(found).toEqual(created);
  });

  test('Should retreive undefined if course is not found', () => {
    const result = service.findCourseById(123);
    expect(result).toBeUndefined();
  });
});
