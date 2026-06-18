import { AppContext } from '@di/context-types';
import { getService } from '@middleware/di/service-injection.middleware';
import { getUserIdBySessionId } from '@repositories/auth/session.repository';
import { errorResponseSchema, sessionResponseSchema } from '@schemas/common.schema';
import type { UserService } from '@services/user/user.service';
import { isValidUUIDv7 } from '@utils/auth/uuid';
import { CookieParser } from '@utils/cookie-parser';
import { ResponseBuilder } from '@utils/response-builder';
import { createTrackedRoute } from '@utils/routing';
import { createOpenAPIRouter } from '@utils/routing/openapi-factory';

const sessionRoutes = createOpenAPIRouter();

const sessionRoute = createTrackedRoute({
  method: 'get',
  path: '/session',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Session info',
      content: {
        'application/json': {
          schema: sessionResponseSchema,
        },
      },
    },
    500: {
      description: 'Session check failed',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const sessionHandler = async (c: AppContext) => {
  try {
    const session_id = CookieParser.getSessionId(c);
    if (!session_id || !isValidUUIDv7(session_id)) {
      return ResponseBuilder.error(c, 'Invalid session', 'INVALID_SESSION', 400);
    }

    const userId = await getUserIdBySessionId(session_id);
    if (!userId) {
      return ResponseBuilder.error(c, 'Invalid session', 'INVALID_SESSION', 400);
    }

    const userService = getService<UserService>(c, 'userService');
    const user = await userService.getUserDetails(userId);

    return ResponseBuilder.success(c, 'Session info', {
      permissions: user.permissions || [],
    });
  } catch {
    return ResponseBuilder.error(c, 'Internal server error', 'SERVER_ERROR', 500);
  }
};

sessionRoutes.openapi(sessionRoute, sessionHandler);

export default sessionRoutes;
