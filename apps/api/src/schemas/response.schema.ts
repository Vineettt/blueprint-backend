import { z } from 'zod';

export const createResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional(),
  });

export const createErrorResponseSchema = () =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    error: z.string(),
  });

export const paginationDataSchema = z.object({
  payload: z.array(z.unknown()),
  length: z.number(),
});

export const userDataSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  status: z.number(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});
export const successDataResponseSchema = createResponseSchema(z.object({}));
export const paginationDataResponseSchema = createResponseSchema(paginationDataSchema);
export const userDataResponseSchema = createResponseSchema(userDataSchema);

export const statusListResponseSchema = createResponseSchema(
  z.object({
    statusList: z.array(
      z.object({
        value: z.number(),
        viewValue: z.string(),
      })
    ),
  })
);

export const mappingDataResponseSchema = createResponseSchema(
  z.object({
    mapping: z.array(z.unknown()),
  })
);
