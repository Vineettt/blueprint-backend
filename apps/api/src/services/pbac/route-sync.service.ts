import { injectable } from 'tsyringe';
import { pbacDb, routes } from '@blueprint/db';
import { inArray } from 'drizzle-orm';
import { RouteTracker } from '@utils/routing/route-introspection';
import { logger } from '@blueprint/logger';
import { RouteInfo } from '@interfaces/domain';

@injectable()
export class RouteSyncService {
  static autoSyncRoutes() {
    throw new Error('Method not implemented.');
  }
  static getSyncStatus() {
    throw new Error('Method not implemented.');
  }
  getRoutes(): RouteInfo[] {
    return RouteTracker.getRoutes();
  }

  async syncRoutesToDb(routeList: RouteInfo[]): Promise<{
    added: number;
    updated: number;
    deleted: number;
    errors: string[];
  }> {
    logger.info('Syncing routes to database');
    const result = {
      added: 0,
      updated: 0,
      deleted: 0,
      errors: [] as string[],
    };

    try {
      logger.debug('Starting route sync', { routeCount: routeList.length });
      const existingRoutes = await pbacDb.select().from(routes);
      logger.logDatabase('select', 'routes', { count: existingRoutes.length });

      const routesToAdd = routeList.filter(
        route =>
          !existingRoutes.some(
            dbRoute =>
              dbRoute.endpoint === route.path && dbRoute.method === route.method.toLowerCase()
          )
      );

      const routesToDelete = existingRoutes.filter(
        dbRoute =>
          !routeList.some(
            route =>
              dbRoute.endpoint === route.path && dbRoute.method === route.method.toLowerCase()
          )
      );

      if (routesToAdd.length > 0) {
        try {
          await pbacDb.insert(routes).values(
            routesToAdd.map(route => ({
              endpoint: route.path,
              method: route.method.toLowerCase(),
            }))
          );
          result.added = routesToAdd.length;
          logger.logDatabase('bulkInsert', 'routes', { count: routesToAdd.length });
        } catch (error) {
          result.errors.push(`Failed to insert routes: ${error}`);
          logger.error('Route insert failed', { routes: routesToAdd, error });
        }
      }

      if (routesToDelete.length > 0) {
        try {
          const deleteIds = routesToDelete.map(dbRoute => dbRoute.id);
          await pbacDb.delete(routes).where(inArray(routes.id, deleteIds));
          result.deleted = routesToDelete.length;
          logger.logDatabase('bulkDelete', 'routes', { count: routesToDelete.length });
        } catch (error) {
          result.errors.push(`Failed to bulk delete routes: ${error}`);
          logger.error('Bulk delete failed', { routes: routesToDelete, error });
        }
      }
    } catch (error) {
      result.errors.push(`Database sync failed: ${error}`);
      logger.error('Database sync failed', error);
    }

    logger.logRouteSync('completed', result);
    return result;
  }

  async autoSyncRoutes(): Promise<{
    added: number;
    updated: number;
    deleted: number;
    errors: string[];
  }> {
    logger.info('Auto-syncing routes');
    const routeList = this.getRoutes();
    return this.syncRoutesToDb(routeList);
  }

  async getSyncStatus(): Promise<{
    totalInDb: number;
    public: number;
    private: number;
    notMapped: number;
  }> {
    try {
      const dbRoutes = await pbacDb.select().from(routes);

      const status = {
        totalInDb: dbRoutes.length,
        public: dbRoutes.filter(r => r.status === 0).length,
        private: dbRoutes.filter(r => r.status === 1).length,
        notMapped: dbRoutes.filter(r => r.status === -1).length,
      };

      logger.debug('Sync status retrieved', status);
      return status;
    } catch (error) {
      logger.error('Failed to get sync status', error);
      throw new Error(`Failed to get sync status: ${error}`);
    }
  }
}
