import { Context } from 'hono';
import { logger } from '@blueprint/logger';

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: unknown;
  timestamp: string;
  path?: string;
}

export const errorHandler = async (err: Error, c: Context) => {
  const path = c.req.path;
  const method = c.req.method;
  const timestamp = new Date().toISOString();

  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    logger.warn('JSON parsing error', {
      path,
      method,
      error: err.message,
    });

    const response: ErrorResponse = {
      success: false,
      message: 'Invalid JSON in request body',
      error: 'INVALID_JSON',
      timestamp,
      path,
    };

    return c.json(response, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT error', {
      path,
      method,
      error: err.message,
    });

    const response: ErrorResponse = {
      success: false,
      message: 'Invalid authentication token',
      error: 'INVALID_TOKEN',
      timestamp,
      path,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return c.json(response, 401 as any);
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('JWT expired', {
      path,
      method,
      error: err.message,
    });

    const response: ErrorResponse = {
      success: false,
      message: 'Authentication token has expired',
      error: 'TOKEN_EXPIRED',
      timestamp,
      path,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return c.json(response, 401 as any);
  }

  if (err instanceof AppError) {
    logger.warn('Application error', {
      path,
      method,
      error: err.message,
      statusCode: err.statusCode,
    });

    const response: ErrorResponse = {
      success: false,
      message: err.message,
      error: err.errorCode,
      details: err.details,
      timestamp,
      path,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return c.json(response, err.statusCode as any);
  }

  if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
    logger.error('Database connection error', {
      path,
      method,
      error: err.message,
    });

    const response: ErrorResponse = {
      success: false,
      message: 'Database connection failed',
      error: 'DATABASE_ERROR',
      timestamp,
      path,
    };

    return c.json(response, 503);
  }

  if (err.message.includes('RATE_LIMIT_EXCEEDED')) {
    logger.warn('Rate limit exceeded', {
      path,
      method,
      error: err.message,
    });

    const response: ErrorResponse = {
      success: false,
      message: 'Too many requests',
      error: 'RATE_LIMIT_EXCEEDED',
      timestamp,
      path,
    };

    return c.json(response, 429);
  }

  if (err.message.includes('Failed to send email')) {
    logger.error('Email service error', {
      path,
      method,
      error: err.message,
    });

    const response: ErrorResponse = {
      success: false,
      message: 'Email service temporarily unavailable',
      error: 'EMAIL_SERVICE_ERROR',
      timestamp,
      path,
    };

    return c.json(response, 503);
  }

  if (err.message.includes('RESET_PASSWORD_ALREADY_SEND')) {
    logger.warn('Password reset cooldown', {
      path,
      method,
      error: err.message,
    });

    const errorParts = err.message.split(':');
    const minutes = errorParts[1] || '0';
    const seconds = errorParts[2] || '0';

    const response: ErrorResponse = {
      success: false,
      message: `Password reset email already sent. Try again in ${minutes}:${seconds}`,
      error: 'RESET_PASSWORD_COOLDOWN',
      details: { cooldownTime: `${minutes}:${seconds}` },
      timestamp,
      path,
    };

    return c.json(response, 429);
  }

  logger.error('Unhandled error', {
    path,
    method,
    error: err.message,
    stack: err.stack,
  });
  
  const response: ErrorResponse = {
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR',
    timestamp,
    path,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c.json(response, 500 as any);
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, errorCode: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'AppError';
  }
}
