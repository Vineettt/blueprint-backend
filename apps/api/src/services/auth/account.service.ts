import { injectable, inject } from 'tsyringe';
import {
  findUserByToken,
  findUserDetailsByToken,
  updateUserStatus,
  markEmailVerificationTokenUsed,
} from '@repositories/auth/user.repository';
import { IEmailService } from '@interfaces/services/email.service.interface';
import { logger } from '@blueprint/logger';
import { DI_TOKENS } from '@di/tokens';
import { ACCOUNT_STATUS } from '@interfaces/domain';

@injectable()
export class AccountService {
  constructor(@inject(DI_TOKENS.IEmailService) private emailService: IEmailService) {}

  async activateAccount(token: string) {
    try {
      if (!token) {
        throw new Error('Token is required');
      }

      const user = await findUserByToken(token);

      if (!user) {
        throw new Error('Invalid or expired activation token');
      }

      if (user.status !== -1) {
        throw new Error('Account is already activated or invalid status');
      }

      await updateUserStatus(user.id, 0);
      await markEmailVerificationTokenUsed(token);

      await this.emailService.sendWelcomeEmail(user.firstName || 'User', user.email);

      logger.info('Account activated', { userId: user.id, email: user.email });

      return {
        userId: user.id,
        email: user.email,
      };
    } catch (error) {
      logger.error('Account activation failed', error);
      throw error;
    }
  }

  async getAccountDetails(token: string) {
    try {
      if (!token) {
        throw new Error('Token is required');
      }

      const user = await findUserDetailsByToken(token);

      if (!user) {
        throw new Error('Invalid or expired token');
      }

      const statusMap: Record<number, string> = {
        [ACCOUNT_STATUS.NOT_ACTIVATED]: 'Not Activated',
        [ACCOUNT_STATUS.ACTIVE]: 'Active',
        [ACCOUNT_STATUS.LOCKED]: 'Locked',
        [ACCOUNT_STATUS.SUSPENDED]: 'Suspended',
      };

      const userDetails = {
        ...user,
        accountStatus: statusMap[user.status ?? ACCOUNT_STATUS.NOT_ACTIVATED] ?? 'Unknown',
      };

      logger.info('Account details retrieved', { userId: user.id, email: user.email });

      return userDetails;
    } catch (error) {
      logger.error('Failed to get account details', error);
      throw error;
    }
  }
}
