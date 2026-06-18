import { injectable } from 'tsyringe';
import {
  insertUserRoleMappings,
  getUserRoleMappings,
  deleteUserRoleMappings,
  getUserRoleMappingsByUserId,
} from '@repositories/pbac/pbac.repository';
import { logger } from '@blueprint/logger';

@injectable()
export class UserRoleMappingService {
  async insertUserRoleMappings(mappings: { userFkId: string; roleFkId: string }[]) {
    try {
      await insertUserRoleMappings(mappings);
      logger.info('User-role mappings inserted', { count: mappings.length });
      return true;
    } catch (error) {
      logger.error('Failed to insert user-role mappings', error);
      throw error;
    }
  }

  async syncUserRoleMappings(mapping: { user_fk_id: string; role_fk_id: string }[]) {
    try {
      if (!mapping.length) return true;

      const userFkId = mapping[0].user_fk_id;

      const existingMappings = await getUserRoleMappingsByUserId(userFkId);

      const existingRoleIds = existingMappings.map((m: { roleFkId: string }) => m.roleFkId);

      const incomingRoleIds = mapping.map(m => m.role_fk_id);

      const rolesToInsert = incomingRoleIds.filter(roleId => !existingRoleIds.includes(roleId));

      if (rolesToInsert.length > 0) {
        await insertUserRoleMappings(
          rolesToInsert.map(roleId => ({
            userFkId,
            roleFkId: roleId,
          }))
        );
      }

      const mappingIdsToDelete = existingMappings
        .filter((m: { id: string; roleFkId: string }) => !incomingRoleIds.includes(m.roleFkId))
        .map((m: { id: string }) => m.id);

      // Delete removed mappings
      if (mappingIdsToDelete.length > 0) {
        await deleteUserRoleMappings(mappingIdsToDelete);
      }

      return true;
    } catch (error) {
      logger.error('Failed to sync user-role mappings', error);
      throw error;
    }
  }

  async getUserRoleMappings(search: string, limit: number, offset: number) {
    try {
      const mappings = await getUserRoleMappings(search, limit, offset);
      logger.info('User-role mappings retrieved', { count: mappings.total });
      return mappings;
    } catch (error) {
      logger.error('Failed to get user-role mappings', error);
      throw error;
    }
  }
}
