import { injectable } from 'tsyringe';
import {
  createRoleRouteMappings,
  deleteRoleRouteMappings,
  getRoleRouteMappings,
} from '@repositories/pbac/pbac.repository';
import { logger } from '@blueprint/logger';

@injectable()
export class RoleRouteMappingService {
  async createRoleRouteMappings(mappings: { roleId: string; routeId: string }[]) {
    try {
      await createRoleRouteMappings(mappings);
      logger.info('Role-route mappings created', { count: mappings.length });
      return true;
    } catch (error) {
      logger.error('Failed to create role-route mappings', error);
      throw error;
    }
  }

  async deleteRoleRouteMappings(mappingIds: string[]) {
    try {
      await deleteRoleRouteMappings(mappingIds);
      logger.info('Role-route mappings deleted', { count: mappingIds.length });
      return true;
    } catch (error) {
      logger.error('Failed to delete role-route mappings', error);
      throw error;
    }
  }

  async getRoleRouteMappings(
    search: string,
    role: string,
    limit: number,
    offset: number,
    status: number[]
  ) {
    try {
      const mappings = await getRoleRouteMappings(search, role, limit, offset, status);
      logger.info('Role-route mappings retrieved', { count: mappings.total });
      return mappings;
    } catch (error) {
      logger.error('Failed to get role-route mappings', error);
      throw error;
    }
  }
}
