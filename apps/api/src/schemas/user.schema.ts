import { z } from 'zod';
import {
  emailSchema,
  paginationSchema,
  ignoreKeySchema,
  passwordSchema,
  authorizationSchema,
} from './common.schema';

export const registerUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export const getUserDetailsSchema = authorizationSchema;

export const updateUserSchema = z.object({
  user: z.array(
    z.object({
      id: z.string(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      status: z.number(),
    })
  ),
  ...ignoreKeySchema.shape,
});

export const searchUsersSchema = paginationSchema;
