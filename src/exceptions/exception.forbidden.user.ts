import { HttpException, HttpStatus } from '@nestjs/common';

export class ForbiddenUserException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}
