import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as Record<string, unknown>).message as string || exception.message;
      code = this.statusToCode(status);
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} ${status}`, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(status).json({
      code,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id'] || undefined,
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'INVALID_INPUT',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMITED',
      500: 'INTERNAL',
    };
    return map[status] || 'UNKNOWN';
  }
}
