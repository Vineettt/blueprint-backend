import { RouteInfo } from '../domain';

export interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export interface SyncStatus {
  totalInDb: number;
  public: number;
  private: number;
  notMapped: number;
}

export interface IRouteSyncService {
  getRoutes(): RouteInfo[];
  syncRoutesToDb(routeList: RouteInfo[]): Promise<SyncResult>;
  autoSyncRoutes(): Promise<SyncResult>;
  getSyncStatus(): Promise<SyncStatus>;
}
