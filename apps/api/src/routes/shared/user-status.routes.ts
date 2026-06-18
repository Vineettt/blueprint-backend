import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import { statusListResponseSchema } from '@schemas/response.schema';
import { errorResponseSchema } from '@schemas/common.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { ErrorHandler } from '@utils/error-handler';
import { logger } from '@blueprint/logger';
import { ACCOUNT_STATUS } from '@interfaces/domain';
import { AppContext } from '@di/context-types';

const userStatusRoutes = createOpenAPIRouter();

const getUserStatusRoute = createTrackedRoute({
  method: 'get',
  path: '/user-status',
  tags: ['Users'],
  responses: {
    200: {
      description: 'User status list retrieved successfully',
      content: {
        'application/json': {
          schema: statusListResponseSchema,
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

const getUserStatusHandler = async (c: AppContext) => {
  try {
    const objectKeys = Object.keys(ACCOUNT_STATUS);
    const statusList: { value: number; viewValue: string }[] = [];

    for (const key of objectKeys) {
      const tempObj: { value: number; viewValue: string } = {
        value: ACCOUNT_STATUS[key as keyof typeof ACCOUNT_STATUS],
        viewValue: key.split('_').join(' ').toUpperCase(),
      };
      statusList.push(tempObj);
    }

    logger.info('User status list retrieved', { count: statusList.length });

    return ResponseBuilder.success(c, 'User status list retrieved successfully', {
      statusList,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Get user status list');
  }
};

userStatusRoutes.openapi(getUserStatusRoute, getUserStatusHandler);

export default userStatusRoutes;
