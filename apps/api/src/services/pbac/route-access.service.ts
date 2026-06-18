import { injectable, inject } from 'tsyringe';
import { RouteCacheService, RouteAccessCacheData } from './route-cache.service';
import { findRouteWithRoles } from '@repositories/pbac/route-access.repository';
import { config } from '@blueprint/config';

@injectable()
export class RouteAccessService {
  constructor(@inject(RouteCacheService) private routeCacheService: RouteCacheService) {}

  async checkRouteAccess(path: string, method: string): Promise<RouteAccessCacheData> {
    const cacheKey = `${method}:${path}`;

    if (!config.cache.routeCacheEnabled) {
      return await this.getRouteFromDatabase(path, method, cacheKey);
    }

    const cached = this.routeCacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    return await this.getRouteFromDatabase(path, method, cacheKey);
  }

  async getRouteFromDatabase(
    path: string,
    method: string,
    cacheKey: string
  ): Promise<RouteAccessCacheData> {
    const routeWithRoles = await findRouteWithRoles(path, method);

    if (routeWithRoles.length === 0) {
      const notFound: RouteAccessCacheData = {
        method: method.toLowerCase(),
        endpoint: `${method}:${path}`,
        authorizedRoles: [],
        status: -1,
      };

      if (process.env.ENABLE_ROUTE_CACHE !== 'false') {
        this.routeCacheService.set(cacheKey, notFound);
      }
      return notFound;
    }

    const firstRoute = {
      id: routeWithRoles[0]?.id as string,
      endpoint: routeWithRoles[0]?.endpoint as string,
      method: routeWithRoles[0]?.method as string,
      status: routeWithRoles[0]?.status as number,
      authorizedRoles: routeWithRoles[0]?.role_fk_ids as string[],
    };

    const routeAccess: RouteAccessCacheData = {
      method: method.toLowerCase(),
      endpoint: `${method}:${path}`,
      authorizedRoles: firstRoute?.authorizedRoles || [],
      status: firstRoute?.status ?? -1,
      routeId: firstRoute?.id,
    };

    if (config.cache.routeCacheEnabled) {
      this.routeCacheService.set(cacheKey, routeAccess);
    }
    return routeAccess;
  }

  invalidateRoute(path: string, method: string): void {
    const cacheKey = `${method}:${path}`;
    this.routeCacheService.invalidateByPattern(cacheKey);
  }

  async clearCache(): Promise<void> {
    this.routeCacheService.clearCache();
  }
}
