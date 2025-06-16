import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { ResponseInterceptor } from 'src/middleware/response.interceptor';
import { PrismaService } from 'src/prisma.service';
import { App } from 'supertest/types';
import { cleanDataBase, cleanMongoDatabase, getDatesAfterToday } from 'test/utils';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AssessmentType } from 'src/schema/assessment.schema';

const TEACHER_ID = 't1';
const USER_ID = 'u1';
const FORBIDDEN_USER_ID = 'u2';

describe('Course e2e', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let connection: Connection;

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

  async function createAssessment(courseId: number, type: string) {
    const assessmentData = {
      userId: TEACHER_ID, // el que crea (auxiliar / profesor)
      title: `${type} 1`,
      description: `It is a ${type} for testing purpose.`,
      type: type,
      startTime: startDate.toISOString(),
      deadline: deadline.toISOString(),
      toleranceTime: 60,
    };

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/assessments`)
      .send(assessmentData);

    return res.body.data;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new BaseExceptionFilter());
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
    const assessment = await createAssessment(course.id, AssessmentType.Exam.toString());

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
    await createAssessment(course.id, AssessmentType.Exam.toString());

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
});
