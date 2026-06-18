import { injectable } from 'tsyringe';
import { LRUCache } from 'lru-cache';

interface RouteAccessCacheData {
  method: string;
  endpoint: string;
  authorizedRoles: string[];
  routeId?: string;
  status: number;
}

@injectable()
export class RouteCacheService {
  private cache: LRUCache<string, RouteAccessCacheData>;

  constructor() {
    this.cache = new LRUCache<string, RouteAccessCacheData>({
      max: 2000,
      ttl: 600000,
      updateAgeOnGet: true,
      allowStale: false,
    });
  }

  get(key: string): RouteAccessCacheData | null {
    try {
      return this.cache.get(key) || null;
    } catch {
      return null;
    }
  }

  set(key: string, data: RouteAccessCacheData): void {
    try {
      this.cache.set(key, data);
    } catch {}
  }

  invalidateByPattern(pattern: string): void {
    try {
      const regexPattern = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.cache.keys()) {
        if (regexPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    } catch {}
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export { RouteAccessCacheData };
