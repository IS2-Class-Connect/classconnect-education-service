import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { BaseExceptionFilter } from '../../src/middleware/exception.filter';
import { ResponseInterceptor } from '../../src/middleware/response.interceptor';
import { cleanDataBase, getDatesAfterToday } from 'test/utils';
import { PrismaService } from 'src/prisma.service';

describe('Course e2e', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const { startDate, endDate, registrationDeadline } = getDatesAfterToday();

  beforeEach(async () => {
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

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await cleanDataBase(prisma);
  });

  afterAll(async () => {
    await cleanDataBase(prisma);

    await prisma.$disconnect();
    await app.close();
  });

  test('POST /courses should create a new course instance', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const res = await request(app.getHttpServer()).post('/courses').send(courseData);

    expect(res.body).toHaveProperty('data');
    const data = res.body.data;

    expect(data).toHaveProperty('id');

    const expected = {
      id: data.id,
      ...courseData,
    };

    expect(res.status).toBe(201);

    expect(data).toEqual(expected);
  });

  test('GET /courses should list all courses', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2.2',
      description: 'Curso de Ingeniería del Software 2.2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };

    await request(app.getHttpServer()).post('/courses').send(courseData);

    const res = await request(app.getHttpServer()).get('/courses');
    const data = res.body.data;

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toEqual({
      id: data[0].id,
      ...courseData,
    });
  });

  test('GET /courses/:id should retreive a course by its id', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2.3',
      description: 'Curso de Ingeniería del Software 2.3',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const id = (await request(app.getHttpServer()).post('/courses').send(courseData)).body.data.id;

    const res = await request(app.getHttpServer()).get(`/courses/${id}`);
    const responseData = res.body.data;

    expect(res.status).toBe(200);
    expect(responseData).toHaveProperty('id', id);
    expect(responseData).toEqual({
      id: id,
      ...courseData,
    });
  });

  test('POST /courses wrong CourseRequestDto should retreive a Bad Request Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/courses')
      .send({ badRequest: 'This is a bad request' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('title', 'BadRequestException');
    expect(res.body).toHaveProperty('status', 400);
    expect(res.body).toHaveProperty('detail');
    expect(res.body).toHaveProperty('instance', '/courses');
  });

  test('GET /courses/{id} getting non existing course should retreive a Course Not Found', async () => {
    const res = await request(app.getHttpServer()).get('/courses/999').send();

    const expectedRes = {
      type: 'about:blank',
      title: 'NotFoundException',
      status: 404,
      detail: 'The course with ID 999 was not found.',
      instance: '/courses/999',
    };

    expect(res.status).toBe(404);
    expect(res.body).toEqual(expectedRes);
  });

  test('PATCH /courses/{id} should retreive the updted course with id', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const id = (await request(app.getHttpServer()).post('/courses').send(courseData)).body.data.id;

    const updatedCourseData = {
      title: 'Ingeniería del Software 2 actualizado',
      description: 'Curso de Ingeniería del Software 2 actualizado',
      totalPlaces: 200,
    };

    const res = await request(app.getHttpServer()).patch(`/courses/${id}`).send(updatedCourseData);

    const responseData = res.body.data;

    const expected = {
      id,
      ...courseData,
      ...updatedCourseData,
    };

    expect(res.status).toBe(200);
    expect(responseData).toEqual(expected);
  });

  test('PATCH /courses/{id} updating non existing course should retreive a Course Not Found', async () => {
    const res = await request(app.getHttpServer()).patch('/courses/999').send({
      title: 'Titulo actualizado',
    });

    const expectedRes = {
      type: 'about:blank',
      title: 'NotFoundException',
      status: 404,
      detail: 'The course with ID 999 was not found.',
      instance: '/courses/999',
    };

    expect(res.status).toBe(404);
    expect(res.body).toEqual(expectedRes);
  });
});
