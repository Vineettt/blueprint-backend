export interface RouteAccessCacheData {
  method: string;
  endpoint: string;
  authorizedRoles: string[];
  routeId?: string;
  status: number;
}

export interface IRouteCacheService {
  get(key: string): RouteAccessCacheData | null;
  set(key: string, data: RouteAccessCacheData): void;
  invalidateByPattern(pattern: string): void;
  clearCache(): void;
}
