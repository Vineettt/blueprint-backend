import { createRateLimit } from './rate-limit.middleware';
import { getSimpleClientIP } from '@utils/system/ip-extractor';
import { Context } from 'hono';

export const createRateLimitStrategy = (config: {
  maxRequests?: number;
  windowMs?: number;
  store?: 'memory' | 'redis';
  keyGenerator?: (c: Context) => string;
}) => createRateLimit(config);
export const rateLimit = createRateLimitStrategy({});

export const strictRateLimit = createRateLimitStrategy({
  maxRequests: 5,
  windowMs: 60000,
  store: 'memory',
});

export const loginRateLimit = createRateLimitStrategy({
  maxRequests: 3,
  windowMs: 900000,
  store: 'memory',
});

export const userRateLimit = createRateLimitStrategy({
  maxRequests: 10,
  windowMs: 60000,
  store: 'memory',
});

export const apiRateLimit = createRateLimitStrategy({
  maxRequests: 1000,
  windowMs: 60000,
  store: 'memory',
});

export const perUserRateLimit = createRateLimit({
  maxRequests: 50,
  windowMs: 60000,
  store: 'memory',
  keyGenerator: (c: Context) => {
    const user = c.get('user');
    return user ? `rate_limit:user:${user.id}` : `rate_limit:ip:${getSimpleClientIP(c)}`;
  },
});

export const tokenBasedRateLimit = createRateLimit({
  maxRequests: 100,
  windowMs: 60000,
  store: 'memory',
  keyGenerator: (c: Context) => {
    const authHeader = c.req.header('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').replace('Bearer', '');
      return token
        ? `rate_limit:token:${token.substring(0, 16)}`
        : `rate_limit:ip:${getSimpleClientIP(c)}`;
    }
    return `rate_limit:ip:${getSimpleClientIP(c)}`;
  },
});

export const hybridRateLimit = createRateLimit({
  maxRequests: 200,
  windowMs: 60000,
  store: 'memory',
  keyGenerator: (c: Context) => {
    const user = c.get('user');
    const authHeader = c.req.header('authorization');

    if (user && authHeader) {
      const token = authHeader.replace('Bearer ', '').replace('Bearer', '');
      return `rate_limit:user:${user.id}:token:${token.substring(0, 16)}`;
    } else if (user) {
      return `rate_limit:user:${user.id}`;
    } else if (authHeader) {
      const token = authHeader.replace('Bearer ', '').replace('Bearer', '');
      return `rate_limit:token:${token.substring(0, 16)}`;
    } else {
      return `rate_limit:ip:${getSimpleClientIP(c)}`;
    }
  },
});

export const perEndpointRateLimit = (maxRequests: number, windowMs: number = 60000) =>
  createRateLimit({
    maxRequests,
    windowMs,
    store: 'memory',
    keyGenerator: (c: Context) => {
      const path = c.req.path;
      const method = c.req.method;
      const user = c.get('user');
      return user ? `rate_limit:${method}:${path}:${user.id}` : `rate_limit:${method}:${path}`;
    },
  });
