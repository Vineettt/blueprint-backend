export interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, value: { count: number; resetTime: number }, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}
