import { LRUCache } from 'lru-cache';
import { RateLimitStore } from '../types';

export class MemoryStore implements RateLimitStore {
  private cache: LRUCache<string, { count: number; resetTime: number }>;

  constructor(maxSize: number = 10000) {
    this.cache = new LRUCache({
      max: maxSize,
      ttl: 60000,
      updateAgeOnGet: true,
      allowStale: false,
    });
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.cache.get(key);
    return entry || null;
  }

  async set(
    key: string,
    value: { count: number; resetTime: number },
    ttl: number = 60000
  ): Promise<void> {
    this.cache.set(key, value, { ttl: Math.floor(ttl / 1000) });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
