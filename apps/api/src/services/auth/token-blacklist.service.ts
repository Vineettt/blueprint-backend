import { injectable, inject } from 'tsyringe';
import { LRUCache } from 'lru-cache';
import { authDb } from '@blueprint/db';
import { sql } from 'drizzle-orm';
import { createHash } from 'crypto';

const tokenBlacklistCache = new LRUCache<string, number>({
  max: 5000,
  ttl: 900000,
  updateAgeOnGet: true,
  allowStale: false,
});

export interface TokenBlacklistStore {
  set(tokenHash: string, expiry: number): Promise<void>;
  get(tokenHash: string): Promise<boolean>;
  cleanup(): Promise<void>;
}

export class DatabaseTokenBlacklist implements TokenBlacklistStore {
  async set(tokenHash: string, expiry: number): Promise<void> {
    tokenBlacklistCache.set(tokenHash, expiry);

    await authDb.execute(sql`
      INSERT INTO token_blacklist (token_hash, expiry_timestamp)
      VALUES (${tokenHash}, ${new Date(expiry)})
      ON CONFLICT (token_hash) DO NOTHING
    `);
  }

  async get(tokenHash: string): Promise<boolean> {
    if (tokenBlacklistCache.has(tokenHash)) {
      return true;
    }

    const result = await authDb.execute(sql`
      SELECT 1 FROM token_blacklist 
      WHERE token_hash = ${tokenHash} 
      AND expiry_timestamp > NOW()
    `);

    if (result.rows.length > 0) {
      tokenBlacklistCache.set(tokenHash, Date.now() + 900000);
    }

    return result.rows.length > 0;
  }

  async cleanup(): Promise<void> {
    await authDb.execute(sql`
      DELETE FROM token_blacklist 
      WHERE expiry_timestamp <= NOW()
    `);
  }
}

@injectable()
export class TokenBlacklistService {
  constructor(@inject(DatabaseTokenBlacklist) private store: TokenBlacklistStore) {}

  async blacklistToken(token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiry = Date.now() + 15 * 60 * 1000;

    await this.store.set(tokenHash, expiry);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return await this.store.get(tokenHash);
  }
}
