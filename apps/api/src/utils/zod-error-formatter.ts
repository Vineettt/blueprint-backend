import { ZodError } from 'zod';

export const formatZodError = (error: ZodError) => {
  const formattedErrors = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return {
    success: false,
    message: 'Validation failed',
    error: 'VALIDATION_ERROR',
    details: formattedErrors,
  };
};
