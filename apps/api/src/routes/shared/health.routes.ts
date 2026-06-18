import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import { healthResponseSchema, healthErrorResponseSchema } from '@schemas/health.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { logger } from '@blueprint/logger';
import { config } from '@blueprint/config';
import { AppContext } from '@di/context-types';

const healthRoutes = createOpenAPIRouter();

const healthRoute = createTrackedRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  responses: {
    200: {
      description: 'Health check',
      content: {
        'application/json': {
          schema: healthResponseSchema,
        },
      },
    },
    500: {
      description: 'Health check failed',
      content: {
        'application/json': {
          schema: healthErrorResponseSchema,
        },
      },
    },
  },
});

const healthCheckHandler = async (c: AppContext) => {
  try {
    const maintenanceMode = config.server.maintenanceMode;

    const healthData = {
      status: maintenanceMode ? 'maintenance' : 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };

    logger.info('Health check performed', healthData);

    const statusCode = maintenanceMode ? 503 : 200;
    return ResponseBuilder.success(c, 'Health check successful', healthData, statusCode);
  } catch (error: unknown) {
    logger.error('Health check failed', error);

    return ResponseBuilder.error(c, 'Health check failed', 'HEALTH_CHECK_FAILED', 500);
  }
};

healthRoutes.openapi(healthRoute, healthCheckHandler);

export default healthRoutes;
