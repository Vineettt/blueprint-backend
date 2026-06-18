import { z } from 'zod';

export const tokenSchema = z.string().min(1, 'Token is required');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .transform(val => val.toLowerCase().trim());

export const paginationSchema = z.object({
  search: z.string().trim().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const authorizationSchema = z.object({
  Authorization: z.string().optional(),
});

export const ignoreKeySchema = z.object({
  IGNORE_KEY: z.string().optional(),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
});

export const sessionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object(),
});

export { passwordSchema } from '@utils/validation/password-validator';

export const currentPasswordSchema = z.string().min(1, 'Current password is required');

export const repeatPasswordSchema = z.string().min(6, 'Password must be at least 6 characters');
