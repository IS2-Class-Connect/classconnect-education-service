import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { isString } from 'class-validator';
import { Request, Response } from 'express';
import { ExceptionResponse } from 'src/exceptions/exception.response';

function getBadRequestMessage(exception: BadRequestException): string {
  const response = exception.getResponse();
  if (!isString(response) && 'message' in response && Array.isArray(response.message)) {
    const constraints = response.message.join('; ');
    return 'The request data does not meet the following constraints: ' + constraints;
  }
  return exception.message;
}

@Catch()
export class BaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let exceptionResponse: ExceptionResponse;
    let status: number;

    if (exception instanceof HttpException) {
      const message =
        exception instanceof BadRequestException
          ? getBadRequestMessage(exception)
          : exception.message;
      status = exception.getStatus();
      exceptionResponse = new ExceptionResponse(exception.name, status, message, request.url);
    } else {
      logger.error('An unexpected error in the request has occured');
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      exceptionResponse = new ExceptionResponse(
        'Internal Server Error',
        status,
        'An unexpected internal server error has ocurred',
        request.url,
      );
    }

    response.status(status).json(exceptionResponse);
  }
}

const logger = new Logger(BaseExceptionFilter.name);
