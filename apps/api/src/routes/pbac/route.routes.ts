import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import {
  listRoutesSchema,
  updateRouteSchema,
  getRoutesByRoleSchema,
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

const routeRoutes = createOpenAPIRouter();
type ListRoutesDTO = z.infer<typeof listRoutesSchema>;
type UpdateRouteDTO = z.infer<typeof updateRouteSchema>;
type GetRoutesByRoleDTO = z.infer<typeof getRoutesByRoleSchema>;

const searchRoutesRoute = createTrackedRoute({
  method: 'post',
  path: '/routes',
  tags: ['Routes'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: listRoutesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Routes retrieved successfully',
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

const searchRoutesHandler = async (c: AppContext) => {
  const { limit, offset, search } = c.get('validatedBody') as ListRoutesDTO;
  const {
    limit: searchLimit,
    offset: searchOffset,
    search: searchTerm,
  } = extractPaginationParams({ limit, offset, search });

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const { payload, total } = await pbacService.searchRoutes(
      searchTerm,
      searchLimit,
      searchOffset
    );

    logger.info('Routes searched', { count: total });

    return ResponseBuilder.success(c, 'Routes retrieved successfully', {
      payload,
      total,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Search routes');
  }
};

routeRoutes.openapi(searchRoutesRoute, searchRoutesHandler);

const updateRoutesRoute = createTrackedRoute({
  method: 'put',
  path: '/route',
  tags: ['Routes'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateRouteSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Routes updated successfully',
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

const updateRoutesHandler = async (c: AppContext) => {
  const validatedData = c.get('validatedBody') as UpdateRouteDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const routesMapping: { id: string; status: number } = {
      id: validatedData.id,
      status: Number(validatedData.status),
    };
    await pbacService.updateRoutes([routesMapping]);
    return ResponseBuilder.success(c, 'Routes updated successfully', {});
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Update routes');
  }
};

routeRoutes.openapi(updateRoutesRoute, updateRoutesHandler);

const getRoutesByRoleRoute = createTrackedRoute({
  method: 'post',
  path: '/route',
  tags: ['Routes'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: getRoutesByRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Routes retrieved successfully',
      content: {
        'application/json': {
          schema: paginationDataResponseSchema,
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

const getRoutesByRoleHandler = async (c: AppContext) => {
  const { role, status, unassignedOnly } = c.get('validatedBody') as GetRoutesByRoleDTO;

  try {
    const pbacService = getService<PbacService>(c, 'pbacService');
    const routes = await pbacService.getRoutesByRole(role, status, unassignedOnly);

    return ResponseBuilder.success(c, 'Routes retrieved successfully', {
      payload: routes,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Get routes by role');
  }
};

routeRoutes.openapi(getRoutesByRoleRoute, getRoutesByRoleHandler);

export default routeRoutes;
