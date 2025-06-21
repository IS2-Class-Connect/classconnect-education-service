import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationService } from 'src/services/pushNotification.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { InternalServerErrorException } from '@nestjs/common';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should successfully notify user when gateway responds with 2xx', async () => {
    const mockResponse: AxiosResponse = {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: new AxiosHeaders({
          Authorization: 'Bearer test-token',
        }),
      },
    };

    (httpService.post as jest.Mock).mockReturnValueOnce(of(mockResponse));

    await expect(
      service.notifyTaskAssignment('123', 'Test Title', 'Test Body'),
    ).resolves.toBeUndefined();

    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications'),
      { uuid: '123', title: 'Test Title', body: 'Test Body', topic: 'task-assignment' },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
        }),
      }),
    );
  });

  it('should throw InternalServerErrorException on non-2xx status', async () => {
    const mockResponse: AxiosResponse = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    (httpService.post as jest.Mock).mockReturnValueOnce(of(mockResponse));

    await expect(service.notifyMessageReceived('123', 'Test Title', 'Test Body')).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications'),
      { uuid: '123', title: 'Test Title', body: 'Test Body', topic: 'message-received' },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
        }),
      }),
    );
  });

  it('should throw InternalServerErrorException when HttpService throws an error', async () => {
    (httpService.post as jest.Mock).mockReturnValueOnce(
      throwError(() => new Error('Connection error')),
    );

    await expect(service.notifyDeadlineReminder('123', 'Test Title', 'Test Body')).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications'),
      { uuid: '123', title: 'Test Title', body: 'Test Body', topic: 'deadline-reminder' },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
        }),
      }),
    );
  });
});
