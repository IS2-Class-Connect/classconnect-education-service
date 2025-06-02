import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Express } from 'express';
import { MetricsController } from '../../src/controllers/metrics.controller';

describe('MetricsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /users/metrics should return status code 200', async () => {
    const response = await request(app.getHttpServer() as Express)
      .get('/users/metrics')
      .send();

    expect(response.status).toEqual(200);
  });
});
