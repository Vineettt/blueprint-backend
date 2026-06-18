import { z } from 'zod';
import { emailSchema, tokenSchema, passwordSchema, repeatPasswordSchema } from '../common.schema';

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerRequestSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: emailSchema,
  password: passwordSchema,
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    user: z.object({
      email: z.string(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      roles: z.array(z.string()),
      permissions: z.array(z.string()),
    }),
    token: z.string(),
  }),
});

export const registerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    userId: z.string(),
    email: z.string(),
  }),
});

export const refreshTokenResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    token: z.string(),
    expiresAt: z.date(),
  }),
});

export const revokeTokenResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  IGNORE_KEY: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
  repeat_password: repeatPasswordSchema,
});

export const resetPasswordWithRepeatSchema = z.object({
  password: passwordSchema,
  repeat_password: repeatPasswordSchema,
  token: tokenSchema,
});

export const activateAccountSchema = z.object({
  token: tokenSchema,
});

export const getAccountDetailsSchema = z.object({
  token: tokenSchema,
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordWithRepeatInput = z.infer<typeof resetPasswordWithRepeatSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
export type GetAccountDetailsInput = z.infer<typeof getAccountDetailsSchema>;
