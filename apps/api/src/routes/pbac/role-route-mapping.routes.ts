import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import {
  createRoleRouteMappingSchema,
  deleteRoleRouteMappingSchema,
  listRoleRouteMappingsSchema,
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
import { MappingDelete, RoleRouteMapping } from '@interfaces/common';
import { z } from 'zod';

type CreateRoleRouteMappingDTO = z.infer<typeof createRoleRouteMappingSchema>;
type DeleteRoleRouteMappingDTO = z.infer<typeof deleteRoleRouteMappingSchema>;
type ListRoleRouteMappingsDTO = z.infer<typeof listRoleRouteMappingsSchema>;

const roleRouteMappingRoutes = createOpenAPIRouter();

const createRoleRouteMappingRoute = createTrackedRoute({
  method: 'post',
  path: '/role-route-mapping',
  tags: ['Role-Route Mappings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createRoleRouteMappingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Role-route mappings created successfully',
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

const createRoleRouteMappingHandler = async (c: AppContext) => {
  const { mapping } = c.get('validatedBody') as CreateRoleRouteMappingDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    await pbacService.createRoleRouteMappings(
      mapping.map((m: RoleRouteMapping) => ({
        roleId: m.role_id,
        routeId: m.route_id,
      }))
    );

    return ResponseBuilder.created(c, 'Role-route mappings created successfully', {});
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Create role-route mappings');
  }
};

roleRouteMappingRoutes.openapi(createRoleRouteMappingRoute, createRoleRouteMappingHandler);

const deleteRoleRouteMappingRoute = createTrackedRoute({
  method: 'delete',
  path: '/role-route-mapping',
  tags: ['Role-Route Mappings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: deleteRoleRouteMappingSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Role-route mappings deleted successfully',
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

const deleteRoleRouteMappingHandler = async (c: AppContext) => {
  const { mapping } = c.get('validatedBody') as DeleteRoleRouteMappingDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    await pbacService.deleteRoleRouteMappings(mapping.map((m: MappingDelete) => m.mapping_id));

    return ResponseBuilder.success(c, 'Role-route mappings deleted successfully', {});
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Delete role-route mappings');
  }
};

roleRouteMappingRoutes.openapi(deleteRoleRouteMappingRoute, deleteRoleRouteMappingHandler);

const getRoleRouteMappingsRoute = createTrackedRoute({
  method: 'post',
  path: '/role-route-mappings',
  tags: ['Role-Route Mappings'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: listRoleRouteMappingsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Role-route mappings retrieved successfully',
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

const getRoleRouteMappingsHandler = async (c: AppContext) => {
  const { limit, offset, search, role, status } = c.get(
    'validatedBody'
  ) as ListRoleRouteMappingsDTO;

  const {
    limit: searchLimit,
    offset: searchOffset,
    search: searchTerm,
  } = extractPaginationParams({ limit, offset, search });
  const roleFilter = role || '';

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const mappings = await pbacService.getRoleRouteMappings(
      searchTerm,
      roleFilter,
      searchLimit,
      searchOffset,
      status
    );

    logger.info('Role-route mappings retrieved', { count: mappings.total });

    return ResponseBuilder.success(c, 'Role-route mappings retrieved successfully', {
      payload: mappings.data,
      total: mappings.total,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Get role-route mappings');
  }
};

roleRouteMappingRoutes.openapi(getRoleRouteMappingsRoute, getRoleRouteMappingsHandler);

export default roleRouteMappingRoutes;
