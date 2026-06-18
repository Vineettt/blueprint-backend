import { z } from 'zod';
import { paginationSchema, ignoreKeySchema } from '../common.schema';

const StatusEnum = z.union([z.literal(-1), z.literal(0), z.literal(1)]);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters'),
  description: z.string().max(255, 'Description must be less than 255 characters').optional(),
});

export const deleteRoleSchema = z.object({
  roles: z.array(
    z.object({
      role_id: z.string(),
    })
  ),
  ...ignoreKeySchema.shape,
});

export const updateRoleSchema = z.object({
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  ...ignoreKeySchema.shape,
});

export const updateLegacyRoleSchema = z.object({
  roles: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
    })
  ),
  ...ignoreKeySchema.shape,
});

export const listRolesSchema = paginationSchema;

export const updateRouteSchema = z.object({
  id: z.string(),
  status: z.enum(['-1', '0', '1']),
  ...ignoreKeySchema.shape,
});

export const listRoutesSchema = paginationSchema;

export const updateLegacyRouteSchema = z.object({
  routes: z.array(
    z.object({
      id: z.string(),
      method: z.string(),
      handler: z.string(),
    })
  ),
  ...ignoreKeySchema.shape,
});

export const getRoutesByRoleSchema = z.object({
  role: z.string(),
  status: z.array(StatusEnum).default([-1, 0, 1]),
  unassignedOnly: z.boolean().default(false),
});

export const createRoleRouteMappingSchema = z.object({
  mapping: z.array(
    z.object({
      role_id: z.string(),
      route_id: z.string(),
    })
  ),
});

export const createUserRoleMappingSchema = z.object({
  mapping: z.array(
    z.object({
      user_fk_id: z.string(),
      role_fk_id: z.string(),
    })
  ),
});

export const deleteRoleRouteMappingSchema = z.object({
  mapping: z.array(
    z.object({
      mapping_id: z.string(),
    })
  ),
  ...ignoreKeySchema.shape,
});

export const listRoleRouteMappingsSchema = z.object({
  ...paginationSchema.shape,
  role: z.string().optional(),
  status: z.array(StatusEnum).default([-1, 0, 1]),
});

export const listUserRoleMappingsSchema = paginationSchema;

export const updateUserRoleMappingSchema = z.object({
  mapping: z
    .array(
      z.object({
        user_fk_id: z.string().min(1, { message: 'User ID is required' }),
        role_fk_id: z.string().min(1, { message: 'Role ID is required' }),
      })
    )
    .min(1, { message: 'At least one mapping is required' }),

  ...ignoreKeySchema.shape,
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type CreateRoleRouteMappingInput = z.infer<typeof createRoleRouteMappingSchema>;
export type CreateUserRoleMappingInput = z.infer<typeof createUserRoleMappingSchema>;
export type DeleteRoleRouteMappingInput = z.infer<typeof deleteRoleRouteMappingSchema>;
export type ListRoleRouteMappingsInput = z.infer<typeof listRoleRouteMappingsSchema>;
export type ListUserRoleMappingsInput = z.infer<typeof listUserRoleMappingsSchema>;
export type UpdateUserRoleMappingInput = z.infer<typeof updateUserRoleMappingSchema>;
