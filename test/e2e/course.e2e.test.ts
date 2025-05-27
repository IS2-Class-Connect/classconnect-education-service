import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { BaseExceptionFilter } from '../../src/middleware/exception.filter';
import { ResponseInterceptor } from '../../src/middleware/response.interceptor';
import { cleanDataBase, getDatesAfterToday } from 'test/utils';
import { PrismaService } from 'src/prisma.service';
import { Role } from '@prisma/client';

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
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: userId,
    };
    const id = (await request(app.getHttpServer()).post('/courses').send(courseData)).body.data.id;

    const updatedCourseData = {
      title: 'Ingeniería del Software 2 actualizado',
      description: 'Curso de Ingeniería del Software 2 actualizado',
      totalPlaces: 200,
    };

    const res = await request(app.getHttpServer())
      .patch(`/courses/${id}`)
      .send({ ...updatedCourseData, userId });

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
      userId: '123e4567-e89b-12d3-a456-426614174000',
    });

    const expectedRes = {
      type: 'about:blank',
      title: 'NotFoundException',
      status: 404,
      detail: 'Course with ID 999 not found.',
      instance: '/courses/999',
    };

    expect(res.status).toBe(404);
    expect(res.body).toEqual(expectedRes);
  });

  test('PATCH /courses/{id} updating a course with an invalid user should retreive a Forbidden User Exception', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUserId = '123e4567-e89b-12d3-a456-426614174001';

    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: userId,
    };

    const id = (await request(app.getHttpServer()).post('/courses').send(courseData)).body.data.id;

    const res = await request(app.getHttpServer()).patch(`/courses/${id}`).send({
      title: 'Titulo actualizado',
      userId: invalidUserId,
    });

    const expectedRes = {
      type: 'about:blank',
      title: 'ForbiddenUserException',
      status: 403,
      detail: `User ${invalidUserId} is not allowed to update the course ${id}. User has to be either the course head teacher or an assistant.`,
      instance: `/courses/${id}`,
    };

    expect(res.status).toBe(403);
    expect(res.body).toEqual(expectedRes);
  });

  test('POST /courses/:id/enrollments should create a new enrollment for a course', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const enrollmentData = {
      userId: '456e7890-e89b-12d3-a456-426614174001',
      role: 'STUDENT',
    };

    const expected = {
      courseId,
      ...enrollmentData,
      favorite: false,
    };

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send(enrollmentData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toEqual(expected);
  });

  test('POST /courses/:id/enrollments with bad request should return Bad Request Error', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send({ badRequest: 'bad request' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('title', 'BadRequestException');
    expect(res.body).toHaveProperty('status', 400);
    expect(res.body).toHaveProperty('detail');
    expect(res.body).toHaveProperty('instance', `/courses/${courseId}/enrollments`);
  });

  test('GET /courses/:id/enrollments should retrieve enrollments for a specific course', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const enrollmentData = {
      userId: '456e7890-e89b-12d3-a456-426614174001',
      role: 'STUDENT',
    };

    const expected = [
      {
        courseId,
        ...enrollmentData,
        favorite: false,
      },
    ];

    await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send(enrollmentData);

    const res = await request(app.getHttpServer()).get(`/courses/${courseId}/enrollments`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data).toEqual(expected);
  });

  test('GET /courses/enrollments should retrieve enrollments matching a specific filter', async () => {
    const courseTitle = 'Ingeniería del Software 2';
    const courseData = {
      title: courseTitle,
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const userId = '456e7890-e89b-12d3-a456-426614174001';

    const enrollmentData = {
      userId,
      role: 'STUDENT',
    };

    const expected = [
      {
        ...enrollmentData,
        course: {
          id: courseId,
          title: courseTitle,
        },
      },
    ];

    await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send(enrollmentData);

    const res1 = await request(app.getHttpServer()).get(`/courses/enrollments?userId=${userId}`);

    expect(res1.status).toBe(200);
    expect(Array.isArray(res1.body.data)).toBe(true);
    expect(res1.body.data.length).toBeGreaterThan(0);
    expect(res1.body.data).toEqual(expected);

    const res2 = await request(app.getHttpServer()).get(
      `/courses/enrollments?userId=${userId}&role=ASSISTANT`,
    );

    expect(res2.status).toBe(200);
    expect(Array.isArray(res2.body.data)).toBe(true);
    expect(res2.body.data.length).toBe(0);
  });

  test('GET /courses/enrollments should thrown Bad Request Exception when non existing properties are passed in filter', async () => {
    const courseTitle = 'Ingeniería del Software 2';
    const courseData = {
      title: courseTitle,
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const userId = '456e7890-e89b-12d3-a456-426614174001';

    const enrollmentData = {
      userId,
      role: 'STUDENT',
    };

    await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send(enrollmentData);

    const res = await request(app.getHttpServer()).get('/courses/enrollments?isVirtual=true');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('title', 'BadRequestException');
    expect(res.body).toHaveProperty('status', 400);
    expect(res.body).toHaveProperty('detail');
    expect(res.body).toHaveProperty('instance', '/courses/enrollments?isVirtual=true');
  });

  test('GET /courses/:id/enrollments for non-existing course should return Not Found Error', async () => {
    const res = await request(app.getHttpServer()).get('/courses/999/enrollments');

    const expectedRes = {
      type: 'about:blank',
      title: 'NotFoundException',
      status: 404,
      detail: 'Course with ID 999 not found.',
      instance: '/courses/999/enrollments',
    };

    expect(res.status).toBe(404);
    expect(res.body).toEqual(expectedRes);
  });

  test('PATCH /courses/{courseId}/enrollments/{userId} should retreive the updated courseId enrollment from userId', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const enrollmentData = {
      userId,
      role: Role.ASSISTANT,
    };

    await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send(enrollmentData);

    const updateData = {
      favorite: true,
    };

    const res = await request(app.getHttpServer())
      .patch(`/courses/${courseId}/enrollments/${userId}`)
      .send(updateData);

    const expected = {
      courseId,
      userId,
      role: Role.ASSISTANT,
      ...updateData,
    };

    const response = res.body.data;

    expect(res.status).toBe(200);
    expect(response).toEqual(expected);
  });

  test('PATCH /courses/{courseId}/enrollments/{userId} updating non existing enrollment should throw NotFoundException', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const updateData = {
      favorite: true,
      role: Role.STUDENT,
    };

    const res = await request(app.getHttpServer())
      .patch(`/courses/${courseId}/enrollments/${userId}`)
      .send(updateData);

    const expectedRes = {
      type: 'about:blank',
      title: 'NotFoundException',
      status: 404,
      detail: `Enrollment for user ${userId} in course ${courseId} not found.`,
      instance: `/courses/${courseId}/enrollments/${userId}`,
    };

    expect(res.status).toBe(404);
    expect(res.body).toEqual(expectedRes);
  });

  test('DELETE /courses/{id}/enrollments/{enrollmentId} should delete an enrollment', async () => {
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const courseId = (await request(app.getHttpServer()).post('/courses').send(courseData)).body
      .data.id;

    const enrollmentData = {
      userId: '456e7890-e89b-12d3-a456-426614174001',
      role: 'STUDENT',
    };

    const expected = {
      courseId,
      ...enrollmentData,
      favorite: false,
    };

    await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send(enrollmentData);

    const res = await request(app.getHttpServer()).delete(
      `/courses/${courseId}/enrollments/${enrollmentData.userId}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toEqual(expected);
  });

  test('GET /courses/{courseId}/activities?userId={userId} should retreive the register activity of the specified course', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    const assistantId = '123e4567-e89b-12d3-a456-426614174001';

    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId,
    };
    const courseRes = await request(app.getHttpServer()).post('/courses').send(courseData);
    const courseId = courseRes.body.data.id;

    await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send({ userId: assistantId, role: 'ASSISTANT' });

    const updatedTitle = 'Ingeniería del Software 2 - Modificado por Asistente';
    await request(app.getHttpServer())
      .patch(`/courses/${courseId}`)
      .send({ title: updatedTitle, userId: assistantId });

    const res = await request(app.getHttpServer()).get(
      `/courses/${courseId}/activities?userId=${teacherId}`,
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const activity = res.body.data.find(
      (a: any) =>
        a.userId === assistantId && a.activity === 'EDIT_COURSE' && a.courseId === courseId,
    );

    expect(activity).toBeDefined();
    expect(activity.id).toBeDefined();
    expect(activity.createdAt).toBeDefined();
  });

  test('GET /courses/{courseId}/activities?userId={userId} with a userId which not match with teacher id should throw ForbiddenUserException', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    const assistantId = '123e4567-e89b-12d3-a456-426614174001';
    const otherUserId = '123e4567-e89b-12d3-a456-426614174002';

    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId,
    };
    const courseRes = await request(app.getHttpServer()).post('/courses').send(courseData);
    const courseId = courseRes.body.data.id;

    // El maestro agrega a un usuario como asistente
    await request(app.getHttpServer())
      .post(`/courses/${courseId}/enrollments`)
      .send({ userId: assistantId, role: 'ASSISTANT' });

    // El asistente hace una modificación
    const updatedTitle = 'Ingeniería del Software 2 - Modificado por Asistente';
    await request(app.getHttpServer())
      .patch(`/courses/${courseId}`)
      .send({ title: updatedTitle, userId: assistantId });

    // Un usuario que no es el profesor intenta consultar el register activity
    const res = await request(app.getHttpServer()).get(
      `/courses/${courseId}/activities?userId=${otherUserId}`,
    );

    const expectedRes = {
      type: 'about:blank',
      title: 'ForbiddenUserException',
      status: 403,
      detail: `User ${otherUserId} is not allowed to get the activity register of the course ${courseId}. Only the head teacher is allowed.`,
      instance: `/courses/${courseId}/activities?userId=${otherUserId}`,
    };

    expect(res.status).toBe(403);
    expect(res.body).toEqual(expectedRes);
  });

  test('POST /courses/:courseId/modules should create a new module for the course by the teacher', async () => {
    const teacherId = '123e4567-e89b-12d3-a456-426614174000';
    const courseData = {
      title: 'Ingeniería del Software 2',
      description: 'Curso de Ingeniería del Software 2',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      totalPlaces: 100,
      teacherId,
    };
    const courseRes = await request(app.getHttpServer()).post('/courses').send(courseData);
    const courseId = courseRes.body.data.id;

    const createDto = {
      title: 'Module 1: Introduction',
      description: 'This module covers the basic concepts.',
      userId: teacherId,
      order: 0,
    };
    const { userId, ...moduleData } = createDto;

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/modules`)
      .send(createDto);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');

    const data = res.body.data;
    expect(data).toHaveProperty('id');
    expect(data).toMatchObject({
      id: data.id,
      courseId,
      ...moduleData,
    });
  });
});
