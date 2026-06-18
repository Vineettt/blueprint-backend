import { injectable } from 'tsyringe';
import {
  updateRoutes,
  getRoutesByRole,
  searchRoutesWithCount,
} from '@repositories/pbac/pbac.repository';
import { logger } from '@blueprint/logger';

@injectable()
export class RouteService {
  async searchRoutes(search: string, limit: number, offset: number) {
    try {
      const routesWithCount = await searchRoutesWithCount(search, limit, offset);
      return routesWithCount;
    } catch (error: unknown) {
      logger.error('Route search failed', error);
      throw error;
    }
  }

  async updateRoutes(routeUpdates: { id: string; status: number }[]) {
    try {
      await updateRoutes(routeUpdates);
      logger.info('Routes updated successfully', { count: routeUpdates.length });
      return true;
    } catch (error: unknown) {
      logger.error('Failed to update routes', error);
      throw error;
    }
  }

  async getRoutesByRole(roleId: string, status: number[], unassignedOnly: boolean) {
    try {
      const routes = await getRoutesByRole(roleId, status, unassignedOnly);
      logger.info('Routes retrieved by role', { roleId, count: routes.length });
      return routes;
    } catch (error) {
      logger.error('Failed to get routes by role', error);
      throw error;
    }
  }
}
