import { injectable } from 'tsyringe';
import {
  findUserByEmail,
  findUserByResetToken,
  updateUserPassword,
  createPasswordResetToken,
  findPendingResetTokenByEmail,
} from '@repositories/auth/user.repository';
import { logger } from '@blueprint/logger';
import { randomBytes, createHash } from 'crypto';
import { hashPassword } from '@utils/auth';

const RESET_TOKEN_EXPIRY_MINUTES = 60;
const RESET_COOLDOWN_MINUTES = 10;

@injectable()
export class PasswordService {
  async resetPassword(password: string, repeatPassword: string, token: string) {
    try {
      if (!password) {
        throw new Error('PASSWORD_REQUIRED');
      }

      if (!repeatPassword) {
        throw new Error('REPEAT_PASSWORD');
      }

      if (password !== repeatPassword) {
        throw new Error('PASSWORD_MISMATCH');
      }

      const tokenHash = createHash('sha256').update(token).digest('hex');
      const user = await findUserByResetToken(tokenHash);

      if (!user) {
        throw new Error('INVALID_TOKEN');
      }

      if (user.status !== 0) {
        throw new Error('ACTIVATE_ACCOUNT');
      }
      const hashedPassword = await hashPassword(password);
      await updateUserPassword(user.email, hashedPassword);
      logger.info('Password reset successful', { email: user.email });

      return user.email;
    } catch (error) {
      logger.error('Password reset failed', error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await findUserByEmail(email);

      if (!user) {
        throw new Error('EMAIL_INCORRECT');
      }

      if (user.status === -1) {
        throw new Error('ACTIVATE_ACCOUNT');
      }

      const pendingToken = await findPendingResetTokenByEmail(email);
      if (pendingToken) {
        const cooldownEnd = new Date(
          pendingToken.createdAt?.getTime() + RESET_COOLDOWN_MINUTES * 60000
        );
        const now = new Date();

        if (cooldownEnd > now) {
          const timeLeft = Math.floor((cooldownEnd.getTime() - now.getTime()) / 1000);
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;

          throw new Error(`RESET_PASSWORD_ALREADY_SEND:${minutes}:${seconds}`);
        }
      }

      const resetToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(resetToken).digest('hex');

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

      await createPasswordResetToken(user.id, tokenHash, expiresAt);

      logger.info('Password reset token generated', { email });

      return { token: resetToken };
    } catch (error) {
      logger.error('Forgot password failed', error);
      throw error;
    }
  }
}
