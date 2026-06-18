import { OpenAPIHono } from '@hono/zod-openapi';
import { formatZodError } from '@utils/zod-error-formatter';

export const createOpenAPIRouter = () => {
  return new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(formatZodError(result.error), 400);
      }
    },
  });
};
