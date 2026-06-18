export interface SessionWithDevice {
  id: string;
  userFkId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  operatingSystem: string | null;
  browser: string | null;
  loginTime: Date;
  logoutTime: Date | null;
  isActive: boolean;
  failedAttempts: number;
  lastActivity: Date;
  deviceDisplayName?: string;
}

export type { UserRolesAndPermissions } from './repositories/pbac.repository.interface';
export type { RouteWithRoles } from './repositories/pbac.repository.interface';
