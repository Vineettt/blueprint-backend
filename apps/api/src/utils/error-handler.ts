import { Context } from 'hono';
import { ResponseBuilder } from './response-builder';
import { logger } from '@blueprint/logger';

export interface ErrorMapping {
  [key: string]: { message: string; status: number };
}

export class ErrorHandler {
  static handleWithMappings(
    c: Context,
    error: unknown,
    errorMappings: ErrorMapping,
    defaultMessage: string = 'Operation failed',
    defaultErrorCode: string = 'OPERATION_FAILED'
  ) {
    logger.error(defaultMessage, error);

    if (error instanceof Error && error.message in errorMappings) {
      const mapping = errorMappings[error.message];
      return ResponseBuilder.error(c, mapping.message, error.message, mapping.status);
    }

    return ResponseBuilder.serverError(c, defaultMessage, defaultErrorCode);
  }

  static handleAuthError(c: Context, error: unknown) {
    const authErrorMappings: ErrorMapping = {
      RESET_TOKEN_EXPIRED: { message: 'Reset token has expired', status: 400 },
      PASSWORD_REQUIRED: { message: 'Password is required', status: 400 },
      REPEAT_PASSWORD: { message: 'Repeat password is required', status: 400 },
      PASSWORD_MISMATCH: { message: 'Passwords do not match', status: 400 },
      EMAIL_INCORRECT: { message: 'Email address not found', status: 400 },
      ACTIVATE_ACCOUNT: { message: 'Please activate your account first', status: 400 },
      RESET_PASSWORD_ALREADY_SEND: {
        message: 'Password reset already sent. Please wait before requesting again.',
        status: 400,
      },
      'Token is required': { message: 'Token is required', status: 400 },
      'Invalid or expired activation token': {
        message: 'Invalid or expired activation token',
        status: 400,
      },
      'Account is already activated or invalid status': {
        message: 'Account is already activated or invalid status',
        status: 400,
      },
      'Invalid activation token': { message: 'Invalid activation token', status: 400 },
      'Invalid or expired token': { message: 'Invalid or expired token', status: 400 },
      INVALID_TOKEN: { message: 'Invalid token', status: 400 },
    };

    return this.handleWithMappings(
      c,
      error,
      authErrorMappings,
      'Authentication failed',
      'AUTH_FAILED'
    );
  }

  static handleGenericError(c: Context, error: unknown, operation: string = 'Operation') {
    logger.error(`${operation} failed`, error);
    return ResponseBuilder.serverError(
      c,
      `${operation} failed`,
      `${operation.toUpperCase()}_FAILED`
    );
  }
}
