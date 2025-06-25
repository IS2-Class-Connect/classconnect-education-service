import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { ResponseInterceptor } from 'src/middleware/response.interceptor';
import { PrismaService } from 'src/prisma.service';
import { App } from 'supertest/types';
import {
  cleanDataBase,
  cleanMongoDatabase,
  FORBIDDEN_USER_ID,
  getDatesAfterToday,
  TEACHER_ID,
  USER_ID,
} from 'test/utils';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AssessmentType } from 'src/schema/assessment.schema';
import { ExerciseType } from 'src/schema/exercise.schema';
import { AssessmentCreateDto } from 'src/dtos/assessment/assessment.create.dto';
import { SubmissionCreateDto } from 'src/dtos/submission/submission.create.dto';
import { SubmissionResponseDto } from 'src/dtos/submission/submission.response.dto';
import { Role } from '@prisma/client';
import { CorrectionCreateDto } from 'src/dtos/correction/correction.create.dto';
import { PushNotificationService } from 'src/services/pushNotification.service';

describe('Course e2e', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let connection: Connection;
  const mockPushService = {
    notifyTaskAssignment: jest.fn(),
    notifyDeadlineReminder: jest.fn(),
    notifyFeedback: jest.fn(),
  };

  const { startDate, endDate, registrationDeadline, deadline } = getDatesAfterToday();

  async function createCourse() {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: TEACHER_ID,
    };
    const courseRes = await request(app.getHttpServer()).post('/courses').send(courseData);
    return courseRes.body.data;
  }

  async function createAssessment(courseId: number, type: AssessmentType) {
    const assessmentDto: AssessmentCreateDto = {
      userId: TEACHER_ID, // who creates it (assistant / teacher)
      title: `${type.toString()} 1`,
      description: `It is a ${type.toString()} for testing purpose.`,
      type: type,
      startTime: startDate.toISOString(),
      deadline: deadline.toISOString(),
      toleranceTime: 60,
      exercises: [
        {
          type: ExerciseType.Mc,
          question: 'For what purpose it’s used this assess?',
          choices: ['To test students', 'To test code'],
          correctChoiceIdx: 1,
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/assessments`)
      .send(assessmentDto);

    return res.body.data;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PushNotificationService)
      .useValue(mockPushService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    const httpAdapterHost = app.getHttpAdapter();
    app.useGlobalFilters(new BaseExceptionFilter(httpAdapterHost));
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await cleanDataBase(prisma);
    await cleanMongoDatabase(connection);
  });

  afterAll(async () => {
    await cleanDataBase(prisma);
    await cleanMongoDatabase(connection);

    await prisma.$disconnect();
    await app.close();
  });

  test('GET /assessments should retreive all the existing assessments', async () => {
    const course = await createCourse();
    const assessment = await createAssessment(course.id, AssessmentType.Exam);

    const expected = [assessment];

    const result = await request(app.getHttpServer()).get('/assessments').send();

    expect(result.body).toHaveProperty('data');
    const data = result.body.data;

    expect(result.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data).toEqual(expected);
  });

  test('GET /assessments?{filter} should retreive all the existing assessments matching the filter passed', async () => {
    const course = await createCourse();
    await createAssessment(course.id, AssessmentType.Exam);

    const expected = [];
    // Create ranges that does not include startDate nor deadline
    const startTimeBegin = new Date(startDate.getTime() + 1).toISOString();
    const startTimeEnd = new Date(startDate.getTime() + 2).toISOString();
    const deadlineBegin = new Date(deadline.getTime() + 1).toISOString();
    const deadlineEnd = new Date(deadline.getTime() + 2).toISOString();
    // range in url never include the assessment registered
    const url = `/assessments?startTimeBegin=${startTimeBegin}&startTimeEnd=${startTimeEnd}&deadlineBegin=${deadlineBegin}&deadlineEnd=${deadlineEnd}`;
    const result = await request(app.getHttpServer()).get(url).send();

    expect(result.body).toHaveProperty('data');
    const data = result.body.data;

    expect(result.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
    expect(data).toEqual(expected);
  });

  test('DELETE /assessments/{assesId} should delete the assessment specified, if exists', async () => {
    const course = await createCourse();
    const assessment = await createAssessment(course.id, AssessmentType.Exam);
    const id = assessment._id;

    const result = await request(app.getHttpServer())
      .delete(`/assessments/${assessment._id}?userId=${assessment.teacherId}`)
      .send();

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('data');
    const { data } = result.body;
    expect(data).toEqual(assessment);

    // Should throw a Not Found Error
    const resultError = await request(app.getHttpServer())
      .delete(`/assessments/${id}?userId=${TEACHER_ID}`)
      .send();
    expect(resultError.status).toBe(404);
  });

  test('POST /assessments/{assesId}/submissions should retreive a created submission for the specified assessment', async () => {
    const course = await createCourse();
    const asses = await createAssessment(course.id, AssessmentType.Exam);
    const assesId = asses._id;

    // Enroll the user as a student in the course
    await request(app.getHttpServer())
      .post(`/courses/${course.id}/enrollments`)
      .send({ userId: USER_ID, role: Role.STUDENT });

    const createDto: SubmissionCreateDto = {
      userId: USER_ID,
      answers: ['1'],
    };

    const expected: Omit<SubmissionResponseDto, 'submittedAt'> = {
      assesId,
      userId: USER_ID,
      answers: [{ answer: '1', correction: '' }],
    };

    const result = await request(app.getHttpServer())
      .post(`/assessments/${assesId}/submissions`)
      .send(createDto);

    expect(result.status).toBe(201);
    expect(result.body).toHaveProperty('data');
    const data = result.body.data;
    expect(data).toEqual({ ...expected, submittedAt: data.submittedAt });

    // Should throw a Conflict Error
    const resultError = await request(app.getHttpServer())
      .post(`/assessments/${assesId}/submissions`)
      .send(createDto);
    expect(resultError.status).toBe(409);
  });

  test('POST /assessments/{assesId}/submissions should throw a Forbidden Error if the user is not a student', async () => {
    const course = await createCourse();
    const asses = await createAssessment(course.id, AssessmentType.Exam);
    const assesId = asses._id;

    const createDto: SubmissionCreateDto = {
      userId: FORBIDDEN_USER_ID,
      answers: ['0'],
    };

    const resultError = await request(app.getHttpServer())
      .post(`/assessments/${assesId}/submissions`)
      .send(createDto);

    expect(resultError.status).toBe(403);
  });

  test('GET /assessments/{assesId}/submissions should retreive all the submissions of the specified assessment', async () => {
    const course = await createCourse();
    const asses = await createAssessment(course.id, AssessmentType.Exam);
    const assesId = asses._id;

    // Enroll the user as a student in the course
    await request(app.getHttpServer())
      .post(`/courses/${course.id}/enrollments`)
      .send({ userId: USER_ID, role: Role.STUDENT });

    const createDto: SubmissionCreateDto = {
      userId: USER_ID,
      answers: ['1'],
    };

    const submissionRes = await request(app.getHttpServer())
      .post(`/assessments/${assesId}/submissions`)
      .send(createDto);

    expect(submissionRes.status).toBe(201);
    expect(submissionRes.body).toHaveProperty('data');
    const submission = submissionRes.body.data;

    const result = await request(app.getHttpServer()).get(`/assessments/${assesId}/submissions`);

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('data');
    const data = result.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0]).toEqual(submission);
  });

  test('GET /assessments/{assesId}/submissions/{userId} should retreive the submission of the specified user for the specified assessment', async () => {
    const course = await createCourse();
    const asses = await createAssessment(course.id, AssessmentType.Exam);
    const assesId = asses._id;

    // Enroll the user as a student in the course
    await request(app.getHttpServer())
      .post(`/courses/${course.id}/enrollments`)
      .send({ userId: USER_ID, role: Role.STUDENT });

    const createDto: SubmissionCreateDto = {
      userId: USER_ID,
      answers: ['1'],
    };

    const submissionRes = await request(app.getHttpServer())
      .post(`/assessments/${assesId}/submissions`)
      .send(createDto);

    expect(submissionRes.status).toBe(201);
    expect(submissionRes.body).toHaveProperty('data');
    const submission = submissionRes.body.data;

    const result = await request(app.getHttpServer()).get(
      `/assessments/${assesId}/submissions/${USER_ID}`,
    );

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('data');
    const data = result.body.data;
    expect(data).toEqual(submission);

    // Should throw a Not Found Error
    const resultError = await request(app.getHttpServer())
      .get(`/assessments/${assesId}/submissions/${FORBIDDEN_USER_ID}`)
      .send();
    expect(resultError.status).toBe(404);
    expect(resultError.body).toHaveProperty('message');
  });

  test('POST /assessments/{assesId}/correction should retreive a created correction for the specified submission', async () => {
    const course = await createCourse();
    const asses = await createAssessment(course.id, AssessmentType.Exam);
    const assesId = asses._id;

    const answer = '1';
    const correction = 'Very good!';

    // Enroll the user as a student in the course
    await request(app.getHttpServer())
      .post(`/courses/${course.id}/enrollments`)
      .send({ userId: USER_ID, role: Role.STUDENT });

    const createDto: SubmissionCreateDto = {
      userId: USER_ID,
      answers: [answer],
    };

    const submissionRes = await request(app.getHttpServer())
      .post(`/assessments/${assesId}/submissions`)
      .send(createDto);

    expect(submissionRes.status).toBe(201);
    expect(submissionRes.body).toHaveProperty('data');
    const submission = submissionRes.body.data;

    const correctionDto: CorrectionCreateDto = {
      teacherId: TEACHER_ID,
      corrections: [correction],
      feedback: 'It seems that you have understood the topic.',
      note: 10,
    };

    const expected: Omit<SubmissionResponseDto, 'correctedAt'> = {
      userId: USER_ID,
      assesId,
      answers: [{ answer: answer, correction: correction }],
      feedback: correctionDto.feedback,
      note: correctionDto.note,
      submittedAt: submission.submittedAt,
      AIFeedback: expect.any(String),
    };

    const result = await request(app.getHttpServer())
      .post(`/assessments/${assesId}/submissions/${USER_ID}/correction`)
      .send(correctionDto);

    expect(result.status).toBe(201);
    expect(result.body).toHaveProperty('data');
    const data = result.body.data;
    expect(data).toEqual({ ...expected, correctedAt: data.correctedAt });
  });
});
