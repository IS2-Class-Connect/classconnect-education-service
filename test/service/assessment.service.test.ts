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
      findById: jest.fn(),
      findEnrollment: jest.fn(),
      createActivityRegister: jest.fn(),
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
