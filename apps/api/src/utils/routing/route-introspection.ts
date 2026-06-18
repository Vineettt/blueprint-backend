import { createRoute, RouteConfig } from '@hono/zod-openapi';
import { RouteInfo } from '@interfaces/domain';
import { z } from 'zod';

type BodySchema = z.ZodType | undefined;

export class RouteTracker {
  private static routes: RouteInfo[] = [];
  private static bodySchemas = new Map<string, BodySchema>();

  static addRoute(method: string, path: string): void {
    this.routes.push({
      method: method.toUpperCase(),
      path,
    });
  }

  static addBodySchema(method: string, path: string, schema: BodySchema): void {
    if (!schema) return;
    this.bodySchemas.set(this.createKey(method, path), schema);
  }

  static getBodySchema(method: string, path: string): BodySchema {
    return this.bodySchemas.get(this.createKey(method, path));
  }

  static getRoutes(): RouteInfo[] {
    return [...this.routes];
  }

  static clear(): void {
    this.routes = [];
    this.bodySchemas.clear();
  }

  private static createKey(method: string, path: string): string {
    const normalizedPath = path.startsWith('/api/') ? path.slice(4) : path;
    return `${method.toUpperCase()}:${normalizedPath}`;
  }
}

const originalCreateRoute = createRoute;

export function createTrackedRoute(config: RouteConfig): ReturnType<typeof createRoute> {
  if (config.method && config.path) {
    RouteTracker.addRoute(config.method, config.path);
    RouteTracker.addBodySchema(
      config.method,
      config.path,
      config.request?.body?.content?.['application/json']?.schema as BodySchema
    );
  }
  return originalCreateRoute(config);
}

export { createTrackedRoute as createRoute };
