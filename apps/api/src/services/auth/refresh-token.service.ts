import { injectable } from 'tsyringe';
import { authDb } from '@blueprint/db';
import { sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { validateRefreshTokenOptimized } from '@repositories/auth/refresh-token.repository';
import { getUserRolesAndPermissions } from '@repositories/pbac/user-roles-permissions.repository';
import { generateJwt } from '@utils/auth/jwt';
import { config } from '@blueprint/config';

const REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7;

export interface RefreshTokenData {
  token: string;
  expiresAt: Date;
}

export interface RefreshedTokenResult {
  newAccessToken: string;
  newRefreshToken: RefreshTokenData;
  userId: string;
}

@injectable()
export class RefreshTokenService {
  async createRefreshToken(userId: string, sessionId: string): Promise<RefreshTokenData> {
    const token = randomBytes(32).toString('hex');
    const hashInput = `${token}:${sessionId}`;
    const tokenHash = createHash('sha256').update(hashInput).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);

    await authDb.execute(sql`
      INSERT INTO refresh_tokens (user_fk_id, session_fk_id, token_hash, expires_at, is_active)
      VALUES (${userId}, ${sessionId}, ${tokenHash}, ${expiresAt}, true)
    `);

    return { token, expiresAt };
  }

  async rotateRefreshToken(
    userId: string,
    currentToken: string,
    sessionId?: string
  ): Promise<RefreshTokenData> {
    const token = randomBytes(32).toString('hex');
    const hashInput = `${token}:${sessionId || ''}`;
    const tokenHash = createHash('sha256').update(hashInput).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);
    const currentTokenHash = createHash('sha256')
      .update(`${currentToken}:${sessionId || ''}`)
      .digest('hex');

    await authDb.execute(sql`
      UPDATE refresh_tokens 
      SET token_hash = ${tokenHash}, expires_at = ${expiresAt}
      WHERE user_fk_id = ${userId} AND token_hash = ${currentTokenHash}
    `);

    return { token, expiresAt };
  }

  async refreshAccessToken(
    refreshToken: string,
    sessionId?: string
  ): Promise<RefreshedTokenResult | null> {
    const tokenData = await validateRefreshTokenOptimized(refreshToken, sessionId);
    if (!tokenData || !tokenData.valid) {
      return null;
    }

    const userRolesPermissions = await getUserRolesAndPermissions(tokenData.userId);
    const newAccessToken = await generateJwt(
      { key: tokenData.userId, roles: userRolesPermissions.role_ids },
      config.jwt.secret,
      config.jwt.expiresIn
    );

    const newRefreshToken = await this.rotateRefreshToken(
      tokenData.userId,
      refreshToken,
      sessionId
    );

    return { newAccessToken, newRefreshToken, userId: tokenData.userId };
  }

  async revokeRefreshToken(token: string, sessionId?: string): Promise<void> {
    const hashInput = `${token}:${sessionId || ''}`;
    const tokenHash = createHash('sha256').update(hashInput).digest('hex');

    await authDb.execute(sql`
      UPDATE refresh_tokens 
      SET is_active = false 
      WHERE token_hash = ${tokenHash}
    `);
  }
}
