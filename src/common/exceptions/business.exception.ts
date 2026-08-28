import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, code: number = HttpStatus.BAD_REQUEST) {
    super(
      {
        code,
        message,
      },
      code,
    );
  }
}
