import { Context } from 'hono';

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
}

export class ResponseBuilder {
  static success<T = unknown>(c: Context, message: string, data?: T, status: number = 200) {
    return c.json(
      {
        success: true,
        message,
        ...(data !== undefined && { data }),
      },
      status as unknown as 200 | 201
    );
  }

  static error(c: Context, message: string, errorCode: string, status: number = 400) {
    return c.json(
      {
        success: false,
        message,
        error: errorCode,
      },
      status as unknown as 400 | 401 | 403 | 404 | 500
    );
  }

  static created<T = unknown>(c: Context, message: string, data?: T) {
    return this.success(c, message, data, 201);
  }

  static unauthorized(
    c: Context,
    message: string = 'Unauthorized',
    errorCode: string = 'UNAUTHORIZED'
  ) {
    return this.error(c, message, errorCode, 401);
  }

  static forbidden(c: Context, message: string = 'Forbidden', errorCode: string = 'FORBIDDEN') {
    return this.error(c, message, errorCode, 403);
  }

  static notFound(c: Context, message: string = 'Not found', errorCode: string = 'NOT_FOUND') {
    return this.error(c, message, errorCode, 404);
  }

  static serverError(
    c: Context,
    message: string = 'Internal server error',
    errorCode: string = 'INTERNAL_ERROR'
  ) {
    return this.error(c, message, errorCode, 500);
  }
}
