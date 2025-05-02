import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { BaseExceptionFilter } from '../../src/middleware/exception.filter';
import { ResponseInterceptor } from '../../src/middleware/response.interceptor';
import { getDatesAfterToday } from 'test/utils';

describe('Course e2e', () => {
  let app: INestApplication<App>;
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
  });

  test('POST /courses should create a new course instance', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
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

  test('POST /courses wrong CourseRequestDTO should retreive a Bad Request Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/courses')
      .send({ badRequest: 'This is a bad request' });

    const expectedRes = {
      type: 'about:blank',
      title: 'BadRequestException',
      status: 400,
      detail:
        'The request data does not meet the following constraints: ' +
        'property badRequest should not exist; ' +
        'title should not be empty; title must be a string; ' +
        'description should not be empty; description must be a string; ' +
        'startDate should not be empty; startDate must be a valid ISO 8601 date string; ' +
        'endDate should not be empty; endDate must be a valid ISO 8601 date string; ' +
        'registrationDeadline should not be empty; registrationDeadline must be a valid ISO 8601 date string; ' +
        'totalPlaces must be an integer number; totalPlaces should not be empty',
      instance: '/courses',
    };

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expectedRes);
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
});
