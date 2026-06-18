import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import {
  createRoleSchema,
  deleteRoleSchema,
  updateRoleSchema,
  listRolesSchema,
} from '@schemas/pbac/pbac.schema';
import { successDataResponseSchema, paginationDataResponseSchema } from '@schemas/response.schema';
import { errorResponseSchema } from '@schemas/common.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { ErrorHandler } from '@utils/error-handler';
import { getService } from '@middleware/di/service-injection.middleware';
import type { PbacService } from '@services/pbac/pbac.service';
import type { AppContext } from '@di/context-types';
import { extractPaginationParams } from '@utils/pagination-helper';
import { logger } from '@blueprint/logger';
import { z } from 'zod';

const roleRoutes = createOpenAPIRouter();
type CreateRoleDTO = z.infer<typeof createRoleSchema>;
type DeleteRoleDTO = z.infer<typeof deleteRoleSchema>;
type UpdateRoleDTO = z.infer<typeof updateRoleSchema>;
type ListRolesDTO = z.infer<typeof listRolesSchema>;

const createRolesRoute = createTrackedRoute({
  method: 'post',
  path: '/role',
  tags: ['Roles'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createRoleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Roles created successfully',
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

const createRolesHandler = async (c: AppContext) => {
  const { name, description } = c.get('validatedBody') as CreateRoleDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const createdRoles = await pbacService.createRoles([{ name, description }]);

    return ResponseBuilder.created(c, 'Roles created successfully', { roles: createdRoles });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Create roles');
  }
};

roleRoutes.openapi(createRolesRoute, createRolesHandler);

const getAllRolesRoute = createTrackedRoute({
  method: 'get',
  path: '/roles',
  tags: ['Roles'],
  responses: {
    200: {
      description: 'Roles retrieved successfully',
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

const getAllRolesHandler = async (c: AppContext) => {
  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const result = await pbacService.getAllRoles();

    return ResponseBuilder.success(c, 'Roles retrieved successfully', { payload: result?.data });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Get roles');
  }
};

roleRoutes.openapi(getAllRolesRoute, getAllRolesHandler);

const deleteRolesRoute = createTrackedRoute({
  method: 'delete',
  path: '/role',
  tags: ['Roles'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: deleteRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Roles deleted successfully',
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

const deleteRolesHandler = async (c: AppContext) => {
  const { roles } = c.get('validatedBody') as DeleteRoleDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const result = await pbacService.deleteRoles(roles.map(r => r.role_id));

    if (result.success) {
      return ResponseBuilder.success(c, 'Roles deleted successfully', result);
    } else {
      return ResponseBuilder.error(
        c,
        result.message || 'Failed to delete roles',
        result.error || 'UNKNOWN_ERROR'
      );
    }
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Delete roles');
  }
};

roleRoutes.openapi(deleteRolesRoute, deleteRolesHandler);

const updateRolesRoute = createTrackedRoute({
  method: 'put',
  path: '/role',
  tags: ['Roles'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Roles updated successfully',
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

const updateRolesHandler = async (c: AppContext) => {
  const { roles } = c.get('validatedBody') as UpdateRoleDTO;

  try {
    const roleMappings = roles.map(r => ({ id: r.id, name: r.name }));

    const pbacService = getService<PbacService>(c, 'pbacService');
    await pbacService.updateRoles(roleMappings);

    return ResponseBuilder.success(c, 'Roles updated successfully', {});
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Update roles');
  }
};

roleRoutes.openapi(updateRolesRoute, updateRolesHandler);

const searchRolesRoute = createTrackedRoute({
  method: 'post',
  path: '/roles',
  tags: ['Roles'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: listRolesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Roles retrieved successfully',
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

const searchRolesHandler = async (c: AppContext) => {
  const { limit, offset, search } = c.get('validatedBody') as ListRolesDTO;
  const {
    limit: searchLimit,
    offset: searchOffset,
    search: searchTerm,
  } = extractPaginationParams({ limit, offset, search });

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const result = await pbacService.searchRoles(searchTerm, searchLimit, searchOffset);

    logger.info('Roles searched', { count: result.data.payload.length, total: result.data.total });

    return ResponseBuilder.success(c, 'Roles retrieved successfully', {
      payload: result.data.payload,
      total: result.data.total,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Search roles');
  }
};

roleRoutes.openapi(searchRolesRoute, searchRolesHandler);

export default roleRoutes;
