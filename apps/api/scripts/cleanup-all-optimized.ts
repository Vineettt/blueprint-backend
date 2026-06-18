import { sql } from 'drizzle-orm';
import { authDb } from '@blueprint/db';
import { logger } from '@blueprint/logger';

export async function cleanupAllExpired() {
  try {
    const result = await authDb.execute(sql`
      WITH expired_tokens AS (
        DELETE FROM refresh_tokens 
        WHERE expires_at <= NOW()
        RETURNING COUNT(*) as deleted_count
      ),
      expired_blacklist AS (
        DELETE FROM token_blacklist 
        WHERE expiry_timestamp <= NOW()
        RETURNING COUNT(*) as deleted_count
      ),
      expired_sessions AS (
        UPDATE user_sessions 
        SET is_active = false, logout_time = NOW()
        WHERE is_active = true AND last_activity < NOW() - INTERVAL '7 days'
        RETURNING COUNT(*) as deactivated_count
      )
      SELECT 
        (SELECT deleted_count FROM expired_tokens) as tokens_deleted,
        (SELECT deleted_count FROM expired_blacklist) as blacklist_deleted,
        (SELECT deactivated_count FROM expired_sessions) as sessions_deactivated
    `);

    const row = result.rows[0] as any;
    const tokensDeleted = parseInt(row.tokens_deleted) || 0;
    const blacklistDeleted = parseInt(row.blacklist_deleted) || 0;
    const sessionsDeactivated = parseInt(row.sessions_deactivated) || 0;

    const totalCleaned = tokensDeleted + blacklistDeleted + sessionsDeactivated;

    if (totalCleaned > 0) {
      logger.info('Cleanup: Removed expired entries', {
        tokensDeleted,
        blacklistDeleted,
        sessionsDeactivated,
        totalCleaned,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info('Cleanup: No expired entries to remove');
    }

    return { tokensDeleted, blacklistDeleted, sessionsDeactivated, totalCleaned };
  } catch (error) {
    logger.error('Cleanup: Failed to remove expired entries', error);
    throw error;
  }
}

cleanupAllExpired()
  .then(({ tokensDeleted, blacklistDeleted, sessionsDeactivated, totalCleaned }) => {
    console.log(`✅ Cleaned up ${totalCleaned} expired entries:`);
    console.log(`   - ${tokensDeleted} expired refresh tokens`);
    console.log(`   - ${blacklistDeleted} expired blacklist entries`);
    console.log(`   - ${sessionsDeactivated} expired sessions`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to cleanup expired entries:', error);
    process.exit(1);
  });
