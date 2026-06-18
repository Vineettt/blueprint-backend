import { Context, Next } from 'hono';
import { formatZodError } from '@utils/zod-error-formatter';
import { RouteTracker } from '@utils/routing/route-introspection';

export const zodValidationMiddleware = () => {
  return async (c: Context, next: Next) => {
    const method = c.req.method;

    const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!hasBody) {
      await next();
      return;
    }

    const schema = RouteTracker.getBodySchema(method, c.req.path);

    if (!schema) {
      await next();
      return;
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          error: 'INVALID_JSON',
          message: 'Request body is not valid JSON',
        },
        400
      );
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      return c.json(formatZodError(result.error), 400);
    }

    c.set('validatedBody', result.data);

    await next();
  };
};
