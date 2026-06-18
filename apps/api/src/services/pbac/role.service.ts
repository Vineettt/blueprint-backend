import { injectable } from 'tsyringe';
import {
  getAllRoles,
  createRolesBulk,
  deleteRoles,
  updateRoles,
  searchRolesWithCount,
  checkRoleRouteMappings,
  checkUserRoleMappings,
} from '@repositories/pbac/role.repository';
import { logger } from '@blueprint/logger';

@injectable()
export class RoleService {
  async createRoles(rolesData: { name: string; description?: string }[]) {
    try {
      const createdRoles = await createRolesBulk(rolesData);
      logger.info('Roles created successfully', { count: createdRoles.length });
      return {
        success: true,
        data: createdRoles,
      };
    } catch (error) {
      logger.error('Failed to create roles', error);
      throw error;
    }
  }

  async getAllRoles() {
    try {
      const roles = await getAllRoles();
      logger.info('Roles retrieved successfully', { count: roles.length });
      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      logger.error('Failed to get roles', error);
      throw error;
    }
  }

  async deleteRoles(roleIds: string[]) {
    try {
      const hasRouteMappings = await checkRoleRouteMappings(roleIds);
      const hasUserMappings = await checkUserRoleMappings(roleIds);

      if (hasRouteMappings?.hasMappings || hasUserMappings?.hasMappings) {
        return {
          success: false,
          error: 'ROLE_HAS_DEPENDENCIES',
          message: `Cannot delete roles that have dependencies. Route Mapping: ${hasRouteMappings?.count}, User Mapping: ${hasUserMappings?.count}`,
        };
      }

      await deleteRoles(roleIds);
      logger.info('Roles deleted successfully', { count: roleIds.length });
      return {
        success: true,
        message: 'Roles deleted successfully',
      };
    } catch (error) {
      logger.error('Failed to delete roles', error);
      throw error;
    }
  }

  async updateRoles(roleUpdates: { id: string; name: string }[]) {
    try {
      await updateRoles(roleUpdates);
      logger.info('Roles updated successfully', { count: roleUpdates.length });
      return {
        success: true,
        message: 'Roles updated successfully',
      };
    } catch (error) {
      logger.error('Failed to update roles', error);
      throw error;
    }
  }

  async searchRoles(search: string, limit: number, offset: number) {
    try {
      const rolesWithCount = await searchRolesWithCount(search, limit, offset);
      logger.info('Role search completed', { search, count: rolesWithCount.total });
      return {
        success: true,
        data: rolesWithCount,
      };
    } catch (error) {
      logger.error('Role search failed', error);
      throw error;
    }
  }
}
