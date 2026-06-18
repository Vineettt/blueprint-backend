import { logger } from '@blueprint/logger';
import { RateLimitStore } from '../types';
import { config } from '@blueprint/config';

export class RedisStore implements RateLimitStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redis: any;
  private keyPrefix = 'rate_limit:';
  private scriptSha = '';
  private readonly luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local operation = ARGV[2]
    local maxRequests = tonumber(ARGV[3])
    local windowMs = tonumber(ARGV[4])
    local ttl = math.floor(windowMs / 1000)
    
    if operation == 'get' then
      local current = redis.call('GET', key)
      local resetTime = tonumber(current) or tonumber(ARGV[5])
      
      if current and now < resetTime then
        return {allowed = true, count = tonumber(current), resetTime = resetTime}
      else
        return {allowed = false, count = 0, resetTime = now + ttl}
      end
    
    elseif operation == 'increment' then
      local current = redis.call('GET', key)
      local resetTime = tonumber(current) or tonumber(ARGV[5])
      
      if current and now < resetTime then
        if current < maxRequests then
          local newCount = tonumber(current) + 1
          local newResetTime = now + ttl
          
          redis.call('SET', key, cjson.encode({count = newCount, resetTime = newResetTime}), 'EX', ttl)
          return {allowed = true, count = newCount, resetTime = newResetTime}
        else
          return {allowed = false, count = current, resetTime = resetTime}
      else
        return {allowed = false, count = 0, resetTime = now + ttl}
      end
    
    elseif operation == 'reset' then
      redis.call('DEL', key)
      return {success = true}
    
    else
      return {error = 'Invalid operation: ' .. operation}
    end
  `;

  constructor() {
    this.initRedis();
    this.loadScript();
  }

  private async initRedis(): Promise<void> {
    const Redis = require('ioredis');

    const isCluster = config.redis.clusterEnabled;
    const redisConfig = isCluster
      ? { nodes: this.parseNodes(), redisOptions: { maxRetriesPerRequest: 3 } }
      : {
          host: config.redis.host,
          port: config.redis.port,
        };

    this.redis = isCluster
      ? new Redis.Cluster(redisConfig.nodes, redisConfig)
      : new Redis(redisConfig);

    this.redis.on('connect', () =>
      logger.info('Redis connected', { mode: isCluster ? 'cluster' : 'single' })
    );
    this.redis.on('error', (err: unknown) => {
      if (err instanceof Error) {
        logger.error('Redis error', { error: err.message });
      } else {
        logger.error('Redis error', { error: String(err) });
      }
    });
  }

  private parseNodes(): Array<{ host: string; port: number }> {
    return config.redis.clusterNodes
      .split(',')
      .filter(Boolean)
      .map(node => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port || '6379') };
      });
  }

  private async loadScript(): Promise<void> {
    try {
      this.scriptSha = await this.redis.script('load', this.luaScript);
      logger.info('Lua script loaded');
    } catch (error) {
      logger.error('Failed to load Lua script', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async get(key: string) {
    try {
      const result = await this.redis.evalsha(
        this.scriptSha,
        1,
        this.keyPrefix + key,
        0,
        'cjson',
        0
      );
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error('Redis get error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl = 60000) {
    try {
      await this.redis.setex(this.keyPrefix + key, Math.floor(ttl / 1000), JSON.stringify(value));
    } catch (error) {
      logger.error('Redis set error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async del(key: string) {
    try {
      await this.redis.del(this.keyPrefix + key);
    } catch (error) {
      logger.error('Redis del error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
