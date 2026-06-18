import { authDb } from '@blueprint/db';
import { sql } from 'drizzle-orm';
import { createHash } from 'crypto';

export const validateRefreshTokenOptimized = async (
  token: string,
  expectedSessionId?: string
): Promise<{ userId: string; valid: boolean } | null> => {
  if (expectedSessionId) {
    const expectedHash = createHash('sha256').update(`${token}:${expectedSessionId}`).digest('hex');

    const result = await authDb.execute(sql`
      SELECT user_fk_id, 
             CASE 
               WHEN token_hash = ${expectedHash} AND is_active = true AND expires_at > NOW() THEN true
               ELSE false
             END as is_valid,
             expires_at
      FROM refresh_tokens 
      WHERE token_hash = ${expectedHash}
        AND is_active = true 
        AND expires_at > NOW()
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as unknown as {
      user_fk_id: string;
      is_valid: boolean;
      expires_at: Date;
    };

    if (!row.is_valid) {
      return null;
    }

    return {
      userId: row.user_fk_id,
      valid: true,
    };
  } else {
    // No sessionId provided — cannot validate without session binding
    return null;
  }
};
