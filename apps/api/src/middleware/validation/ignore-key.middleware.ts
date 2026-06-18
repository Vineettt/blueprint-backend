import { Context, Next } from 'hono';
import { ResponseBuilder } from '@utils/response-builder';
export const ignoreKeyMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method;

  if (!['PUT', 'DELETE'].includes(method)) {
    await next();
    return;
  }

  const body = c.get('validatedBody') as Record<string, unknown> | undefined;

  if (!body || !body.IGNORE_KEY) {
    return ResponseBuilder.error(c, 'IGNORE_KEY is required', 'IGNORE_KEY_REQUIRED');
  }

  await next();
};

export const createIgnoreKeyMiddleware = () => ignoreKeyMiddleware;
