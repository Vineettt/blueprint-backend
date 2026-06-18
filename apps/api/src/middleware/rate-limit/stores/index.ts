import { MemoryStore } from './memory-store';
import { RedisStore } from './redis-store';
import type { RateLimitStore } from '../types';

export function createStore(store: 'memory' | 'redis' = 'memory'): RateLimitStore {
  try {
    if (store === 'redis') {
      return new RedisStore();
    } else {
      return new MemoryStore();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize Redis store, falling back to memory', {
      error: error instanceof Error ? error.message : String(error),
    });
    return new MemoryStore();
  }
}

export { MemoryStore, RedisStore, RateLimitStore };
