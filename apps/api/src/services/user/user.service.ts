import { injectable, inject } from 'tsyringe';
import {
  findUserByEmail,
  findUserById,
  findUsersByEmailSearchWithCount,
  findUsersByIds,
  updateUser,
} from '@repositories/auth/user.repository';
import { createUserWithRoleAndToken } from '@repositories/auth/user-registration.repository';
import { getUserRolesAndPermissions } from '@repositories/pbac/user-roles-permissions.repository';
import { IEmailService } from '@interfaces/services/email.service.interface';
import { logger } from '@blueprint/logger';
import { ACCOUNT_STATUS } from '@interfaces/domain';
import { DI_TOKENS } from '@di/tokens';

export type RegisterUserResult =
  | {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      status: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: null;
      isDeleted: number;
    }
  | {
      success: false;
      message: string;
      error: string;
    };

@injectable()
export class UserService {
  constructor(@inject(DI_TOKENS.IEmailService) private emailService: IEmailService) {}

  async registerUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<RegisterUserResult> {
    try {
      const existingUser = await findUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
          error: 'EMAIL_ALREADY_EXISTS',
        };
      }

      const user = await createUserWithRoleAndToken(userData, 'basic_user');

      await this.emailService.sendAccountActivationEmail(user.email, user.activationToken);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { activationToken, ...safeUser } = user;

      return {
        ...safeUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: 0,
      };
    } catch (error) {
      logger.error('User registration failed', error);
      throw error;
    }
  }

  async getUserDetails(userId: string) {
    try {
      const user = await findUserById(userId);

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.status !== ACCOUNT_STATUS.ACTIVE) {
        throw new Error('USER_NOT_ACTIVE');
      }

      const userRolesPermissions = await getUserRolesAndPermissions(userId);
      const roles = userRolesPermissions.role_names;
      const permissions = userRolesPermissions.permissions;

      const userDetails = {
        ...user,
        roles,
        permissions,
      };

      logger.info('User details retrieved', { userId });

      return userDetails;
    } catch (error) {
      logger.error('Failed to get user details', error);
      throw error;
    }
  }

  async searchUsers(search: string, limit: number, offset: number) {
    try {
      const result = await findUsersByEmailSearchWithCount(search, limit, offset);

      logger.info('User search completed', {
        search,
        count: result.total,
      });

      return result;
    } catch (error) {
      logger.error('User search failed', error);
      throw error;
    }
  }

  async updateUsers(
    users: Array<{ id: string; firstName: string; lastName: string; status: number }>
  ) {
    try {
      if (!Array.isArray(users) || users.length === 0) {
        throw new Error('INVALID_USER_ARRAY');
      }

      const requiredFields: Array<keyof (typeof users)[0]> = [
        'id',
        'firstName',
        'lastName',
        'status',
      ];
      for (const user of users) {
        for (const field of requiredFields) {
          if (!(field in user) || user[field] === undefined || user[field] === null) {
            throw new Error(`MISSING_REQUIRED_FIELD: ${field}`);
          }
        }
      }

      const userIds = [...new Set(users.map(u => u.id))];
      const existingUsers = await findUsersByIds(userIds);

      if (existingUsers.length === 0) {
        throw new Error('NO_USERS_FOUND');
      }

      const existingUsersMap = new Map(existingUsers.map(u => [u.id, u]));
      const changes: Array<{ id: string; firstName: string; lastName: string; status: number }> =
        [];

      for (const user of users) {
        const existingUser = existingUsersMap.get(user.id);
        if (!existingUser) {
          logger.warn('User not found for update', { userId: user.id });
          continue;
        }

        const hasChanges =
          existingUser.firstName !== user.firstName ||
          existingUser.lastName !== user.lastName ||
          existingUser.status !== user.status;

        if (hasChanges) {
          changes.push({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
          });
        }
      }

      if (changes.length === 0) {
        logger.info('No changes required for user update');
        return { updatedCount: 0 };
      }

      for (const change of changes) {
        await updateUser(change.id, {
          firstName: change.firstName,
          lastName: change.lastName,
          status: change.status,
        });
      }

      logger.info('Users updated successfully', { updatedCount: changes.length });

      return { updatedCount: changes.length };
    } catch (error) {
      logger.error('User update failed', error);
      throw error;
    }
  }
}
