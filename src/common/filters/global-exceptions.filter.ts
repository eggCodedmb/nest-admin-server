import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误，请联系管理员';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const msg = (res as any).message;
        if (Array.isArray(msg)) {
          message = msg[0]; // 取校验错误的第一条
        } else if (typeof msg === 'string') {
          message = msg;
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`[Unhandled Exception] ${exception.message}`, exception.stack);
      message = exception.message || '服务器内部错误';
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
      path: request.url,
      timestamp: Date.now(),
    });
  }
}
