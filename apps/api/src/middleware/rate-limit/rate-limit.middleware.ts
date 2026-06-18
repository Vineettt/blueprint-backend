import { Context, Next } from 'hono';
import { logger } from '@blueprint/logger';
import { createStore, RateLimitStore } from './stores';
import { getSimpleClientIP } from '@utils/system/ip-extractor';
import { config } from '@blueprint/config';

export const createRateLimit = (
  options: {
    maxRequests?: number;
    windowMs?: number;
    store?: 'memory' | 'redis';
    keyGenerator?: (c: Context) => string;
  } = {}
) => {
  const { maxRequests = 100, windowMs = 60000, store = config.rateLimit.store } = options;

  let rateLimitStore: RateLimitStore;

  try {
    rateLimitStore = createStore(store);
    logger.info('Rate limiting: Using store', { store });
  } catch (error) {
    logger.warn('Failed to initialize store, falling back to memory', {
      error: error instanceof Error ? error.message : String(error),
    });
    rateLimitStore = createStore('memory');
  }

  return async (c: Context, next: Next) => {
    const key = options.keyGenerator
      ? options.keyGenerator(c)
      : `rate_limit:${getSimpleClientIP(c)}`;
    const now = Date.now();

    try {
      const record = await rateLimitStore.get(key);

      if (!record || now > record.resetTime) {
        await rateLimitStore.set(
          key,
          {
            count: 1,
            resetTime: now + windowMs,
          },
          windowMs
        );
      } else if (record.count >= maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          count: record.count,
          maxRequests,
          resetTime: record.resetTime,
        });

        return c.json(
          {
            success: false,
            message: 'Too many requests',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((record.resetTime - now) / 1000),
          },
          429
        );
      } else {
        await rateLimitStore.set(
          key,
          {
            count: record.count + 1,
            resetTime: record.resetTime,
          },
          windowMs
        );
      }

      await next();
    } catch (error) {
      logger.error('Rate limiting error', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      await next();
    }
  };
};
