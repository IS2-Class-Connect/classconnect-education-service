import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Enrollment, Role } from '@prisma/client';
import { AssessmentCreateDto } from 'src/dtos/assessment/assessment.create.dto';
import { AssessmentFilterDto } from 'src/dtos/assessment/assessment.filter.dto';
import { AssessmentResponseDto } from 'src/dtos/assessment/assessment.response.dto';
import { AssessmentUpdateDto } from 'src/dtos/assessment/assessment.update.dto';
import { CorrectionCreateDto } from 'src/dtos/correction/correction.create.dto';
import { AssessmentPerformanceDto } from 'src/dtos/course/course.assessmentPerformance.dto';
import { CoursePerformanceDto } from 'src/dtos/course/course.performance.dto';
import { StudentPerformanceInCourseDto } from 'src/dtos/course/course.studentPerformance.dto';
import { SubmissionCreateDto } from 'src/dtos/submission/submission.create.dto';
import { SubmissionResponseDto } from 'src/dtos/submission/submission.response.dto';
import { ForbiddenUserException } from 'src/exceptions/exception.forbidden.user';
import { AssessmentRepository } from 'src/repositories/assessment.repository';
import { CourseRepository } from 'src/repositories/course.repository';
import { Assessment, AssessmentType } from 'src/schema/assessment.schema';
import { ExerciseType } from 'src/schema/exercise.schema';
import { Submission, SubmittedAnswer } from 'src/schema/submission.schema';
import { AssessmentService } from 'src/services/assessment.service';
import {
  ASSES_ID,
  COURSE_ID,
  FORBIDDEN_USER_ID,
  getDatesAfterToday,
  TEACHER_ID,
  USER_ID,
} from 'test/utils';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let mockCourseRepo: CourseRepository;
  let mockAssesRepo: AssessmentRepository;
  const { startDate, deadline } = getDatesAfterToday();

  // submissions should have the same number of answers as exercises
  function getMockedAssessment(submissions?: Record<string, Submission>) {
    const asses: Assessment = {
      title: 'Assessment',
      type: AssessmentType.Exam,
      courseId: COURSE_ID,
      userId: TEACHER_ID,
      teacherId: TEACHER_ID,
      startTime: startDate,
      deadline,
      toleranceTime: 5,
      createdAt: startDate,
      exercises: [
        {
          type: ExerciseType.Written,
          question: 'Is this a test?',
        },
      ],
      submissions,
    };
    return asses;
  }

  beforeEach(() => {
    mockCourseRepo = {
      findById: jest.fn(),
      findEnrollment: jest.fn(),
      createActivityRegister: jest.fn(),
      findCourseEnrollments: jest.fn(),
    } as any;
    mockAssesRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAssessments: jest.fn(),
      findByCourseId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setAssesSubmission: jest.fn(),
    } as any;
    service = new AssessmentService(mockAssesRepo, mockCourseRepo);
  });

  test('Should create an assessment', async () => {
    const courseId = 1;
    const createDto: AssessmentCreateDto = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      startTime: startDate.toISOString(),
      deadline: deadline.toISOString(),
      toleranceTime: 0,
      userId: 'u1',
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };

    const { userId, ...createData } = createDto;

    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      ...createData,
      startTime: startDate,
      deadline,
      courseId,
      teacherId: userId,
      userId,
      createdAt: new Date(),
    };

    // Ignore 'id' as it’s not included in AssessmentResponseDto nor is necessary
    const expected: AssessmentResponseDto = {
      ...assessment,
    };

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({ id: courseId, teacherId: userId });
    (mockAssesRepo.create as jest.Mock).mockResolvedValue(assessment);

    expect(await service.createAssess(courseId, createDto)).toEqual(expected);
    expect(mockCourseRepo.findById).toHaveBeenCalledWith(courseId);
    expect(mockAssesRepo.create).toHaveBeenCalledWith({
      ...createDto,
      startTime: startDate,
      deadline,
      teacherId: userId,
      courseId,
    });
  });

  test('Should throw an exception when trying to create an assessment with non valid values', async () => {
    const courseId = 1;
    const createDto: AssessmentCreateDto = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      startTime: deadline.toISOString(), // startTime must be before deadline
      deadline: deadline.toISOString(),
      toleranceTime: 0,
      userId: 'u1',
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };

    await expect(service.createAssess(courseId, createDto)).rejects.toThrow(BadRequestException);
  });

  test('Should throw an exception when a forbidden user tries to create an assessment', async () => {
    const courseId = 1;
    const forbiddenUser = 'u1';
    const createExamDto: AssessmentCreateDto = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      startTime: startDate.toISOString(),
      deadline: deadline.toISOString(),
      toleranceTime: 0,
      userId: forbiddenUser,
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };
    const createTaskDto: AssessmentCreateDto = {
      ...createExamDto,
      type: AssessmentType.Task,
    };

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({ id: courseId, teacherId: 't1' });
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(service.createAssess(courseId, createExamDto)).rejects.toThrow(
      ForbiddenUserException,
    );
    await expect(service.createAssess(courseId, createTaskDto)).rejects.toThrow(
      ForbiddenUserException,
    );
  });

  test('Should find the specified assessment', async () => {
    const id = 'a1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: 'u1',
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: 'u1',
      createdAt: new Date(),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };

    const expected: AssessmentResponseDto = {
      ...assessment,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);

    expect(await service.findAssess(id)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
  });

  test('Should throw an exception when trying to find a non existent assessment', async () => {
    const id = 'a1';
    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(null);

    await expect(service.findAssess(id)).rejects.toThrow(NotFoundException);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
  });

  test('Should get all the assessments matching a specified filter', async () => {
    const filter: AssessmentFilterDto = {
      type: AssessmentType.Exam,
    };

    const assessments: Assessment[] = [
      {
        title: 'Testing exam',
        description: 'Is an exam to use for the tests',
        type: AssessmentType.Exam,
        startTime: startDate,
        deadline,
        toleranceTime: 10,
        courseId: 1,
        userId: 'a1',
        teacherId: 'a1',
        createdAt: new Date(),
        exercises: [
          {
            type: ExerciseType.Mc,
            question: 'For what purpose it’s used this assess?',
            choices: ['To test students', 'To test code'],
            correctChoiceIdx: 1,
          },
        ],
      },
    ];

    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    const expected: AssessmentResponseDto[] = [{ ...assessments[0] }];

    expect(await service.getAssessments(filter)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith(filter);
  });

  test('Should find all the assessments belonging to a specific course', async () => {
    const courseId = 1;
    const assessments: Assessment[] = [
      {
        // TODO: complete with exercises and submissions
        title: 'Testing exam',
        description: 'This is an exam for testing purposes',
        type: AssessmentType.Exam,
        toleranceTime: 0,
        userId: 'u1',
        startTime: startDate,
        deadline,
        courseId,
        teacherId: 'u1',
        createdAt: new Date(),
        exercises: [
          {
            type: ExerciseType.Mc,
            question: 'For what purpose it’s used this assess?',
            choices: ['To test students', 'To test code'],
            correctChoiceIdx: 1,
          },
        ],
      },
    ];

    const expected: AssessmentResponseDto[] = [
      {
        ...assessments[0],
      },
    ];

    (mockAssesRepo.findByCourseId as jest.Mock).mockResolvedValue(assessments);

    expect(await service.findAssessmentsByCourse(courseId)).toEqual(expected);
    expect(mockAssesRepo.findByCourseId).toHaveBeenCalledWith(courseId);
  });

  test('Should update an existing assessment', async () => {
    const id = 'a1';
    const userId = 'u1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId,
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: userId,
      createdAt: new Date(),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };

    const updateDto: AssessmentUpdateDto = {
      title: 'Updated testing exam',
      userId,
    };

    const updatedAssessment: Assessment = {
      ...assessment,
      title: updateDto.title ?? assessment.title,
    };

    const expected: AssessmentResponseDto = {
      ...updatedAssessment,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);
    (mockAssesRepo.update as jest.Mock).mockResolvedValue(updatedAssessment);

    expect(await service.updateAssess(id, updateDto)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
    expect(mockAssesRepo.update).toHaveBeenCalledWith(id, { title: updateDto.title });
  });

  test('Should throw an exception when trying to update an assessment with non valid values', async () => {
    const id = 'a1';
    const userId = 'u1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId,
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: userId,
      createdAt: new Date(),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };

    const updateDto: AssessmentUpdateDto = {
      startTime: deadline.toISOString(),
      userId,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);

    await expect(service.updateAssess(id, updateDto)).rejects.toThrow(BadRequestException);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
    expect(mockAssesRepo.update).not.toHaveBeenCalled();
  });

  test('Should throw an exception when a forbidden user tries to update an assessment', async () => {
    const courseId = 1;
    const forbiddenUser = 'u1';
    const updateDto: AssessmentUpdateDto = {
      title: 'Updated testing assess',
      userId: forbiddenUser,
    };

    (mockAssesRepo.findById as jest.Mock).mockImplementation((id: string) => ({
      courseId,
      teacherId: 't1',
      type: id === 'a1' ? AssessmentType.Exam : AssessmentType.Task,
    }));
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(service.updateAssess('a1', updateDto)).rejects.toThrow(ForbiddenUserException);
    await expect(service.updateAssess('a2', updateDto)).rejects.toThrow(ForbiddenUserException);
  });

  test('Should delete an assessment', async () => {
    const id = 'a1';
    const userId = 'u1';
    const assessment: Assessment = {
      // TODO: complete with exercises and submissions
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId,
      startTime: startDate,
      deadline,
      courseId: 1,
      teacherId: userId,
      createdAt: new Date(),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };

    const expected: AssessmentResponseDto = {
      ...assessment,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(assessment);
    (mockAssesRepo.delete as jest.Mock).mockResolvedValue(assessment);

    expect(await service.deleteAssess(id, userId)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(id);
    expect(mockAssesRepo.delete).toHaveBeenCalledWith(id);
  });

  test('Should throw an exception when a forbidden user tries to delete an assessment', async () => {
    const courseId = 1;
    const forbiddenUser = 'u1';

    (mockAssesRepo.findById as jest.Mock).mockImplementation((id: string) => ({
      courseId,
      teacherId: 't1',
      type: id === 'a1' ? AssessmentType.Exam : AssessmentType.Task,
    }));
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(service.deleteAssess('a1', forbiddenUser)).rejects.toThrow(ForbiddenUserException);
    await expect(service.deleteAssess('a2', forbiddenUser)).rejects.toThrow(ForbiddenUserException);
  });

  test('Should create a submission of the assessment', async () => {
    const mockedDate = new Date('2024-06-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockedDate as unknown as Date);

    const createDto: SubmissionCreateDto = {
      userId: USER_ID,
      answers: ['This is the answer for first exercise', 'This is the answer for second exercise'],
    };

    const answers: SubmittedAnswer[] = [
      {
        answer: 'This is the answer for first exercise',
        correction: '',
      },
      {
        answer: 'This is the answer for second exercise',
        correction: '',
      },
    ];

    const submission: Submission = {
      answers,
      submittedAt: new Date(),
    };

    const expected: SubmissionResponseDto = {
      userId: USER_ID,
      assesId: ASSES_ID,
      ...submission,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue({ courseId: COURSE_ID });
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue({
      courseId: COURSE_ID,
      userId: USER_ID,
      role: Role.STUDENT,
    });
    (mockAssesRepo.setAssesSubmission as jest.Mock).mockResolvedValue(submission);

    expect(await service.createSubmission(ASSES_ID, createDto)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(ASSES_ID);
    expect(mockAssesRepo.setAssesSubmission).toHaveBeenCalledWith(ASSES_ID, USER_ID, submission);
    expect(mockCourseRepo.findEnrollment).toHaveBeenCalledWith(COURSE_ID, USER_ID);

    jest.restoreAllMocks();
  });

  test('Should throw an exception when trying to repeatly create a user submission to assessment', async () => {
    const createDto: SubmissionCreateDto = {
      userId: USER_ID,
      answers: ['This is the answer for first exercise', 'This is the answer for second exercise'],
    };

    const submissions = {
      [USER_ID]: {
        answers: [
          {
            answer: 'This is the original first answer',
            correction: '',
          },
          {
            answer: 'This is the origin second answer',
            correction: '',
          },
        ],
        submittedAt: new Date(),
      },
    };
    (mockAssesRepo.findById as jest.Mock).mockResolvedValue({ courseId: COURSE_ID, submissions });

    await expect(service.createSubmission(ASSES_ID, createDto)).rejects.toThrow(ConflictException);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(ASSES_ID);
  });

  test('Should find a specified assessment submission', async () => {
    const submission: Submission = {
      answers: [
        {
          answer: '1',
          correction: '',
        },
      ],
      submittedAt: new Date(),
    };

    const asses: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {
        [USER_ID]: submission,
      },
    };

    const expected: SubmissionResponseDto = {
      userId: USER_ID,
      assesId: ASSES_ID,
      ...submission,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(asses);

    expect(await service.getAssesSubmission(ASSES_ID, USER_ID)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(ASSES_ID);
  });

  test('Should get all the submissions of a specified assessment', async () => {
    const submission1: Submission = {
      answers: [
        {
          answer: '1',
          correction: '',
        },
      ],
      submittedAt: new Date(),
    };

    const submission2: Submission = {
      answers: [
        {
          answer: '0',
          correction: '',
        },
      ],
      submittedAt: new Date(),
    };

    const asses: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {
        [USER_ID]: submission1,
        [FORBIDDEN_USER_ID]: submission2,
      },
    };

    const expected: SubmissionResponseDto[] = [
      {
        userId: USER_ID,
        assesId: ASSES_ID,
        ...submission1,
      },
      {
        userId: FORBIDDEN_USER_ID,
        assesId: ASSES_ID,
        ...submission2,
      },
    ];

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(asses);

    expect(await service.getAssesSubmissions(ASSES_ID)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(ASSES_ID);
  });

  test('Should add a correction to an assessment submission', async () => {
    const answer = 'Yes, it is!';
    const correction = 'That’s correct!';

    const asses: Assessment = getMockedAssessment({
      [USER_ID]: {
        answers: [
          {
            answer,
            correction: '',
          },
        ],
        submittedAt: deadline,
      },
    });

    const createDto: CorrectionCreateDto = {
      teacherId: TEACHER_ID,
      corrections: [correction],
      feedback: 'Good job!',
      note: 10,
    };

    const newSubmission: Submission = {
      answers: [
        {
          answer,
          correction,
        },
      ],
      submittedAt: deadline,
      correctedAt: expect.any(Date),
      feedback: createDto.feedback,
      note: createDto.note,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(asses);
    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({
      id: COURSE_ID,
      teacherId: TEACHER_ID,
    });
    (mockAssesRepo.setAssesSubmission as jest.Mock).mockResolvedValue(newSubmission);

    const expected: SubmissionResponseDto = {
      ...newSubmission,
      userId: USER_ID,
      assesId: ASSES_ID,
    };

    expect(await service.createCorrection(ASSES_ID, USER_ID, createDto)).toEqual(expected);
    expect(mockAssesRepo.findById).toHaveBeenCalledWith(ASSES_ID);
    expect(mockCourseRepo.findById).toHaveBeenCalledWith(COURSE_ID);
    expect(mockAssesRepo.setAssesSubmission).toHaveBeenCalledWith(ASSES_ID, USER_ID, newSubmission);
  });

  test('Should throw an exception when trying to add a correction to a non existing submission', async () => {
    const asses = getMockedAssessment();
    const createDto: CorrectionCreateDto = {
      teacherId: TEACHER_ID,
      corrections: ['Good job!'],
      feedback: 'Good job!',
      note: 10,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(asses);
    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({
      id: COURSE_ID,
      teacherId: TEACHER_ID,
    });
    await expect(service.createCorrection(ASSES_ID, USER_ID, createDto)).rejects.toThrow(
      NotFoundException,
    );
  });

  test('Should throw an exception when a forbidden user tries to add a correction', async () => {
    (mockAssesRepo.findById as jest.Mock).mockResolvedValue({ courseId: COURSE_ID });
    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({ teacherId: TEACHER_ID });

    const createDto: CorrectionCreateDto = {
      teacherId: FORBIDDEN_USER_ID,
      corrections: ['Good job!'],
      feedback: 'Good job!',
      note: 10,
    };

    await expect(service.createCorrection(ASSES_ID, USER_ID, createDto)).rejects.toThrow(
      ForbiddenUserException,
    );
  });

  test('Should throw an exception when trying to add a correction with different number of answers and corrections', async () => {
    const asses: Assessment = getMockedAssessment({
      [USER_ID]: {
        answers: [
          {
            answer: 'Yes, it is!',
            correction: '',
          },
        ],
        submittedAt: deadline,
      },
    });

    const createDto: CorrectionCreateDto = {
      teacherId: TEACHER_ID,
      corrections: [],
      feedback: 'Good job!',
      note: 10,
    };

    (mockAssesRepo.findById as jest.Mock).mockResolvedValue(asses);
    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({
      id: COURSE_ID,
      teacherId: TEACHER_ID,
    });

    await expect(service.createCorrection(ASSES_ID, USER_ID, createDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  test('Should return an empty list with a course with no assessments', async () => {
    const courseId = COURSE_ID;
    const from = undefined;
    const till = undefined;

    const expected = {
      averageGrade: 0,
      completionRate: 0,
      openRate: 0,
      totalAssessments: 0,
      totalSubmissions: 0,
    } as CoursePerformanceDto;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue([]);

    expect(await service.calculateCoursePerformanceSummary(courseId, from, till)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return an empty list with a course with no assessments and time range', async () => {
    const courseId = COURSE_ID;
    const till = new Date();
    const from = new Date(till.getTime() - 1000);

    const expected = {
      averageGrade: 0,
      completionRate: 0,
      openRate: 0,
      totalAssessments: 0,
      totalSubmissions: 0,
    } as CoursePerformanceDto;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue([]);

    expect(await service.calculateCoursePerformanceSummary(courseId, from, till)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return two open assessments', async () => {
    const courseId = COURSE_ID;
    const from = undefined;
    const till = undefined;

    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {},
    };

    const assessments: Assessment[] = [
      {
        ...assessment,
        title: 'one',
      },
      {
        ...assessment,
        title: 'two',
      },
    ];

    const expected = {
      averageGrade: 0,
      completionRate: 0,
      openRate: 1,
      totalAssessments: 2,
      totalSubmissions: 0,
    } as CoursePerformanceDto;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    expect(await service.calculateCoursePerformanceSummary(courseId, from, till)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return 2 assessments', async () => {
    const courseId = COURSE_ID;
    const from = undefined;
    const till = undefined;

    const now = new Date();
    const deadline = new Date(now.getTime() - 1000);
    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(deadline.getTime() - 1000),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {},
    };

    const assessments: Assessment[] = [
      {
        ...assessment,
        title: 'one',
      },
      {
        ...assessment,
        title: 'two',
      },
    ];

    const expected = {
      averageGrade: 0,
      completionRate: 0,
      openRate: 0,
      totalAssessments: 2,
      totalSubmissions: 0,
    } as CoursePerformanceDto;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    expect(await service.calculateCoursePerformanceSummary(courseId, from, till)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return 0 closed assessments because the range does not take them into consideration', async () => {
    const courseId = COURSE_ID;
    const now = new Date();

    const from = new Date(now.getTime() - 500);
    const till = undefined;

    const deadline = new Date(now.getTime() - 1000);
    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(deadline.getTime() - 1000),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {},
    };

    const assessments: Assessment[] = [
      {
        ...assessment,
        title: 'one',
      },
      {
        ...assessment,
        title: 'two',
      },
    ];

    const expected = {
      averageGrade: 0,
      completionRate: 0,
      openRate: 0,
      totalAssessments: 0,
      totalSubmissions: 0,
    } as CoursePerformanceDto;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    expect(await service.calculateCoursePerformanceSummary(courseId, from, till)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return a nice summary for a course with assessments and submissions', async () => {
    const courseId = COURSE_ID;
    const now = new Date();

    const from = new Date(1000);
    const till = new Date(now.getTime() - 100);

    const deadline = new Date(now.getTime() - 1000);
    const correctedAt = new Date(now.getTime() - 500);
    const submittedAt = new Date(now.getTime() - 750);

    const submission: Submission = {
      answers: [
        {
          answer: '1',
          correction: '',
        },
      ],
      submittedAt,
    };

    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(deadline.getTime() - 1000),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {
        [USER_ID]: {
          note: 9,
          correctedAt,
          ...submission,
        },
        [USER_ID + 1]: {
          note: 7,
          correctedAt,
          ...submission,
        },
      },
    };

    const assessments: Assessment[] = [
      {
        ...assessment,
        title: 'one',
      },
      {
        ...assessment,
        title: 'two',
      },
      {
        ...assessment,
        title: 'three',
        deadline: new Date(now.getTime() + 1000),
        createdAt: new Date(10),
      },
    ];

    const expected = {
      averageGrade: 8,
      completionRate: 1,
      openRate: 0,
      totalAssessments: 2,
      totalSubmissions: 6,
    } as CoursePerformanceDto;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    expect(await service.calculateCoursePerformanceSummary(courseId, from, till)).toEqual(expected);
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return an empty summary with no assessments', async () => {
    const courseId = COURSE_ID;
    const studentId = USER_ID;

    const expected = {
      averageGrade: 0,
      completedAssessments: 0,
      totalAssessments: 0,
    } as StudentPerformanceInCourseDto;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue([]);

    expect(await service.calculateStudentPerformanceSummaryInCourse(courseId, studentId)).toEqual(
      expected,
    );
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return partial summary with assessments but no submissions', async () => {
    const courseId = COURSE_ID;
    const studentId = USER_ID;

    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(deadline.getTime() - 1000),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {},
    };

    const expected = {
      averageGrade: 0,
      completedAssessments: 0,
      totalAssessments: 2,
    } as StudentPerformanceInCourseDto;

    const assessments: Assessment[] = [
      {
        ...assessment,
      },
      {
        ...assessment,
      },
    ];

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    expect(await service.calculateStudentPerformanceSummaryInCourse(courseId, studentId)).toEqual(
      expected,
    );
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return a nice summary for a student in a course', async () => {
    const courseId = COURSE_ID;
    const studentId = USER_ID;

    const now = new Date();
    const deadline = new Date(now.getTime() - 1000);
    const correctedAt = new Date(now.getTime() - 500);
    const submittedAt = new Date(now.getTime() - 750);

    const submission: Submission = {
      answers: [
        {
          answer: '1',
          correction: '',
        },
      ],
      submittedAt,
    };

    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(now.getTime() - 1000),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {
        [USER_ID]: {
          note: 9,
          correctedAt,
          ...submission,
        },
        ['1']: {
          note: 7,
          correctedAt,
          ...submission,
        },
      },
    };

    const assessments: Assessment[] = [
      {
        ...assessment,
        title: 'one',
      },
      {
        ...assessment,
        title: 'two',
      },
      {
        ...assessment,
        title: 'three',
        submissions: {
          ["1"]: submission,
        }
      },
    ];

    const expected = {
      averageGrade: 9,
      completedAssessments: 2,
      totalAssessments: 3,
    } as StudentPerformanceInCourseDto;

    (mockCourseRepo.findEnrollment as jest.Mock).mockResolvedValue({});
    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);

    expect(await service.calculateStudentPerformanceSummaryInCourse(courseId, studentId)).toEqual(
      expected,
    );
    expect(mockAssesRepo.findAssessments).toHaveBeenCalledWith({ courseId });
  });

  test('Should return an empty list of summaries when the course has no assessments', async () => {
    const courseId = COURSE_ID;

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue([]);
    (mockCourseRepo.findCourseEnrollments as jest.Mock).mockResolvedValue([]);

    expect(await service.calculateAssessmentPerformanceSummariesInCourse(courseId)).toEqual([]);
    expect(mockCourseRepo.findCourseEnrollments).toHaveBeenCalledWith(courseId);
  });

  test('Should return a list with some assessments but no submissions', async () => {
    const now = new Date();

    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(now.getTime() - 1000),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {},
    };

    const assessments: Assessment[] = [
      {
        ...assessment,
        title: 'one',
      },
      {
        ...assessment,
        title: 'two',
      },
      {
        ...assessment,
        title: 'three',
      },
    ];

    const enrollment: Enrollment = {
      userId: USER_ID,
      courseId: COURSE_ID,
      favorite: false,
      role: Role.STUDENT,
      studentFeedback: null,
      studentNote: null,
      courseFeedback: null,
      courseNote: null,
    };

    const enrollments: Enrollment[] = [
      {
        ...enrollment,
      },
      {
        ...enrollment,
        userId: USER_ID + 1,
      },
    ];

    const expected: AssessmentPerformanceDto[] = [
      {
        title: 'one',
        averageGrade: 0,
        completionRate: 0,
      },
      {
        title: 'two',
        averageGrade: 0,
        completionRate: 0,
      },
      {
        title: 'three',
        averageGrade: 0,
        completionRate: 0,
      },
    ];

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);
    (mockCourseRepo.findCourseEnrollments as jest.Mock).mockResolvedValue(enrollments);

    expect(await service.calculateAssessmentPerformanceSummariesInCourse(COURSE_ID)).toEqual(
      expected,
    );
  });

  test('Should return a nice summary of assessment performance in a course', async () => {
    const now = new Date();

    const submission: Submission = {
      answers: [
        {
          answer: '1',
          correction: '',
        },
      ],
      submittedAt: now,
    };

    const assessment: Assessment = {
      title: 'Testing exam',
      description: 'This is an exam for testing purposes',
      type: AssessmentType.Exam,
      toleranceTime: 0,
      userId: USER_ID,
      startTime: startDate,
      deadline,
      courseId: COURSE_ID,
      teacherId: USER_ID,
      createdAt: new Date(now.getTime() - 1000),
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
      submissions: {
        ['u1']: {
          note: 8,
          correctedAt: now,
          ...submission,
        },
        ['u2']: {
          note: 2,
          correctedAt: now,
          ...submission,
        },
      },
    };

    const assessments: Assessment[] = [
      {
        ...assessment,
        title: 'one',
      },
      {
        ...assessment,
        title: 'two',
      },
      {
        ...assessment,
        title: 'three',
      },
    ];

    const enrollment: Enrollment = {
      userId: USER_ID,
      courseId: COURSE_ID,
      favorite: false,
      role: Role.STUDENT,
      studentFeedback: null,
      studentNote: null,
      courseFeedback: null,
      courseNote: null,
    };

    const enrollments: Enrollment[] = [
      {
        ...enrollment,
      },
      {
        ...enrollment,
        userId: USER_ID + 1,
      },
    ];

    const expected: AssessmentPerformanceDto[] = [
      {
        title: 'one',
        averageGrade: 5,
        completionRate: 1,
      },
      {
        title: 'two',
        averageGrade: 5,
        completionRate: 1,
      },
      {
        title: 'three',
        averageGrade: 5,
        completionRate: 1,
      },
    ];

    (mockCourseRepo.findById as jest.Mock).mockResolvedValue({});
    (mockAssesRepo.findAssessments as jest.Mock).mockResolvedValue(assessments);
    (mockCourseRepo.findCourseEnrollments as jest.Mock).mockResolvedValue(enrollments);

    expect(await service.calculateAssessmentPerformanceSummariesInCourse(COURSE_ID)).toEqual(
      expected,
    );
  });
});
