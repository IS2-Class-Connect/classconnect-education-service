import { Role } from '@prisma/client';
import { CourseQueryDto } from 'src/dtos/course/course.query.dto';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Assessment } from 'src/schema/assessment.schema';
import { DeadlineCheckerService } from 'src/services/deadline.checker.service';
import { PushNotificationService } from 'src/services/pushNotification.service';
import { ASSES_ID, COURSE_ID, USER_ID } from 'test/utils';

describe('DeadlineCheckerService', () => {
  let service: DeadlineCheckerService;
  let mockAssesRepo: AssessmentRepository;
  let mockCourseRepo: CourseRepository;
  let mockNotificationService: PushNotificationService;
  // const { startDate, endDate, registrationDeadline } = getDatesAfterToday();

  beforeEach(() => {
    mockNotificationService = {
      gatewayUrl: '',
      gatewayToken: '',
      validTopics: [],
      httpService: { post: jest.fn() },
      notifyTaskAssignment: jest.fn(),
      notifyDeadlineReminder: jest.fn(),
      notifyFeedback: jest.fn(),
    } as any;
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
      findAssessments: jest.fn(),
    } as any;
    service = new DeadlineCheckerService(mockAssesRepo, mockNotificationService, mockCourseRepo);
  });

  test('should notify students of upcoming deadlines', async () => {
    const mockCourse = { id: COURSE_ID, title: 'Test Course' };
    const mockEnrollment = { userId: USER_ID, courseId: COURSE_ID, role: Role.STUDENT };
    const mockAssessment = {
      _id: ASSES_ID,
      title: 'Test Assessment',
      courseId: COURSE_ID,
    };

    (mockCourseRepo.findCourses as jest.Mock).mockResolvedValue([mockCourse]);
    (mockCourseRepo.findEnrollments as jest.Mock).mockResolvedValue([mockEnrollment]);
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue([mockAssessment]);

    await service.checkDeadlines();

    // Wait for the async call to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockNotificationService.notifyDeadlineReminder).toHaveBeenCalledWith(
      mockEnrollment.userId,
      'Upcoming deadline',
      `The assignment "${mockAssessment.title}" is due soon.`,
    );
  });
});
