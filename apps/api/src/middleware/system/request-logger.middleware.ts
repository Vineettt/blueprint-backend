import { Context, Next } from 'hono';
import { logger } from '@blueprint/logger';

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();

  let body = null;
  try {
    const contentType = c.req.header('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = await c.req.json();
    }
  } catch {
    body = null;
  }

  logger.info('Request started', {
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    body,
  });

  await next();

  const duration = Date.now() - start;

  logger.info('Request completed', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
  });
};
