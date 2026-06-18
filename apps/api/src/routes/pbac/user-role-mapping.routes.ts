import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import {
  createUserRoleMappingSchema,
  listUserRoleMappingsSchema,
  updateUserRoleMappingSchema,
} from '@schemas/pbac/pbac.schema';
import { successDataResponseSchema, paginationDataResponseSchema } from '@schemas/response.schema';
import { errorResponseSchema } from '@schemas/common.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { ErrorHandler } from '@utils/error-handler';
import { getService } from '@middleware/di/service-injection.middleware';
import type { PbacService } from '@services/pbac/pbac.service';
import { logger } from '@blueprint/logger';
import type { AppContext } from '@di/context-types';
import { extractPaginationParams } from '@utils/pagination-helper';
import { UserRoleMapping } from '@interfaces/repositories/user.repository.interface';
import z from 'zod';

const userRoleMappingRoutes = createOpenAPIRouter();
type CreateUserRoleMappingDTO = z.infer<typeof createUserRoleMappingSchema>;
type UpdateUserRoleMappingDTO = z.infer<typeof updateUserRoleMappingSchema>;
type ListUserRoleMappingsDTO = z.infer<typeof listUserRoleMappingsSchema>;

const createUserRoleMappingRoute = createTrackedRoute({
  method: 'post',
  path: '/user-role-mapping',
  tags: ['User-Role Mappings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserRoleMappingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User-role mappings created successfully',
      content: {
        'application/json': {
          schema: successDataResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const createUserRoleMappingHandler = async (c: AppContext) => {
  const { mapping } = c.get('validatedBody') as CreateUserRoleMappingDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    await pbacService.updateUserRoleMappings(
      mapping.map((m: UserRoleMapping) => ({ userFkId: m.user_fk_id, roleFkId: m.role_fk_id }))
    );

    return ResponseBuilder.created(c, 'User-role mappings created successfully', {});
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Create user-role mappings');
  }
};

userRoleMappingRoutes.openapi(createUserRoleMappingRoute, createUserRoleMappingHandler);

const updateUserRoleMappingRoute = createTrackedRoute({
  method: 'put',
  path: '/user-role-mapping',
  tags: ['User-Role Mappings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateUserRoleMappingSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User-role mappings updated successfully',
      content: {
        'application/json': {
          schema: successDataResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const updateUserRoleMappingHandler = async (c: AppContext) => {
  const { mapping } = c.get('validatedBody') as UpdateUserRoleMappingDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    await pbacService.updateUserRoleMappingsWithValidation(mapping);

    return ResponseBuilder.success(c, 'User-role mappings updated successfully', {});
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Roles do not exist')) {
      return ResponseBuilder.error(c, error.message, 'ROLES_NOT_EXIST');
    }
    return ErrorHandler.handleGenericError(c, error, 'Update user-role mappings');
  }
};

userRoleMappingRoutes.openapi(updateUserRoleMappingRoute, updateUserRoleMappingHandler);

const getUserRoleMappingRoute = createTrackedRoute({
  method: 'post',
  path: '/user-role-mappings',
  tags: ['User-Role Mappings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: listUserRoleMappingsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User-role mappings retrieved successfully',
      content: {
        'application/json': {
          schema: paginationDataResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getUserRoleMappingHandler = async (c: AppContext) => {
  const { limit, offset, search } = c.get('validatedBody') as ListUserRoleMappingsDTO;
  const {
    limit: searchLimit,
    offset: searchOffset,
    search: searchTerm,
  } = extractPaginationParams({ limit, offset, search });

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const mappings = await pbacService.getUserRoleMappings(searchTerm, searchLimit, searchOffset);

    logger.info('User-role mappings retrieved', { count: mappings.total });

    return ResponseBuilder.success(c, 'User-role mappings retrieved successfully', {
      payload: mappings.data,
      total: mappings.total,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Get user-role mappings');
  }
};

userRoleMappingRoutes.openapi(getUserRoleMappingRoute, getUserRoleMappingHandler);

export default userRoleMappingRoutes;
