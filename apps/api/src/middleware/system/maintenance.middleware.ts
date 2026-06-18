import { Context, Next } from 'hono';
import { config } from '@blueprint/config';

export const maintenanceMiddleware = async (c: Context, next: Next) => {
  const maintenanceMode = config.server.maintenanceMode;

  if (maintenanceMode) {
    const maintenanceResponse = {
      status: 'maintenance',
      service: 'blueprint-api',
      timestamp: new Date().toISOString(),
      message: 'Service is currently under maintenance. Please try again later.',
    };

    return c.json(maintenanceResponse, 503);
  }

  await next();
};
