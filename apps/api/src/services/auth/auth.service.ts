import { injectable } from 'tsyringe';
import {
  fetchAuthProfileWithDbTime,
  updateUser,
  logFailedAttempt,
  getLastLoginAttempts,
} from '@repositories/auth/user.repository';

import { getUserRolesAndPermissions } from '@repositories/pbac/user-roles-permissions.repository';
import { hashCompare } from '@utils/auth/hashing';
import { generateJwt } from '@utils/auth/jwt';
import { config } from '@blueprint/config';
import {
  IAuthService,
  LoginContext,
  LoginResult,
} from '@interfaces/services/auth.service.interface';

@injectable()
export class AuthService implements IAuthService {
  async login(email: string, password: string, context?: LoginContext): Promise<LoginResult> {
    const authProfile = await fetchAuthProfileWithDbTime(email);

    if (!authProfile) {
      return {
        success: false,
        error: 'EMAIL_PASSWORD_INCORRECT',
        message: 'Invalid email or password',
      };
    }

    const { user, nowDb } = authProfile;

    if (user.status === -1) {
      return {
        success: false,
        error: 'NOT_ACTIVATED',
        message: 'Account not activated. Please verify your email address to continue.',
      };
    }

    if (user.status === 2) {
      return {
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Account suspended',
      };
    }

    if (
      user.status === 1 &&
      user.accountLockedUntil &&
      user.accountLockedUntil.getTime() <= nowDb.getTime()
    ) {
      await updateUser(user.id, {
        status: 0,
        accountLockedUntil: null,
        updatedAt: new Date(),
      });

      user.status = 0;
      user.accountLockedUntil = null;
    }

    if (user.status === 1 && user.accountLockedUntil && user.accountLockedUntil > nowDb) {
      const remainingMs = user.accountLockedUntil.getTime() - nowDb.getTime();

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);

      return {
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: `Account locked. Try again in ${minutes}:${seconds.toString().padStart(2, '0')}`,
      };
    }

    const isValid = await hashCompare(password, user.password || '');

    if (!isValid) {
      await logFailedAttempt({
        userFkId: user.id,
        email: user.email,
        remark: 'PASSWORD_INCORRECT',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });

      const attempts = await getLastLoginAttempts(user.email, 9);

      const remarks = attempts.map(a => a.remark);

      const lockConfig = [
        { count: 9, minutes: 60 },
        { count: 6, minutes: 30 },
        { count: 3, minutes: 15 },
      ];
      const matchedLock = lockConfig.find(
        ({ count }) =>
          remarks.length >= count && remarks.slice(0, count).every(r => r === 'PASSWORD_INCORRECT')
      );

      if (matchedLock) {
        await updateUser(user.id, {
          status: 1,
          accountLockedUntil: new Date(nowDb.getTime() + matchedLock.minutes * 60 * 1000),
          updatedAt: new Date(),
        });

        return {
          success: false,
          error: 'ACCOUNT_LOCKED_NOW',
          message: `Too many failed attempts. Account locked for ${matchedLock.minutes} minutes.`,
        };
      }

      return {
        success: false,
        error: 'EMAIL_PASSWORD_INCORRECT',
        message: 'Invalid email or password',
      };
    }

    await logFailedAttempt({
      userFkId: user.id,
      email: user.email,
      remark: 'SUCCESS',
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    await updateUser(user.id, {
      status: 0,
      accountLockedUntil: null,
      updatedAt: new Date(),
    });

    const userRolesPermissions = await getUserRolesAndPermissions(user.id);

    const token = await generateJwt(
      {
        key: user.id,
        roles: userRolesPermissions.role_ids,
      },
      config.jwt.secret,
      config.jwt.expiresIn
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;

    return {
      success: true,
      user: {
        ...safeUser,
        roles: userRolesPermissions.role_names,
        permissions: userRolesPermissions.permissions,
      },
      token,
    };
  }
}
