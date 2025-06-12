import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { AssessmentService } from 'src/services/assessment.service';
import { getDatesAfterToday } from 'test/utils';

describe('CourseService', () => {
  let service: AssessmentService;
  let mockCourseRepo: CourseRepository;
  let mockAssesRepo: AssessmentRepository;
  const { startDate, endDate, registrationDeadline } = getDatesAfterToday();

  beforeEach(() => {
    mockCourseRepo = {
      findAll: jest.fn(),
      findCourses: jest.fn(),
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
      createResource: jest.fn(),
      findResourcesByModule: jest.fn(),
      findResource: jest.fn(),
      updateResource: jest.fn(),
      deleteResource: jest.fn(),
    } as any;
    mockAssesRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAssessments: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new AssessmentService(mockAssesRepo, mockCourseRepo);
  });
});
