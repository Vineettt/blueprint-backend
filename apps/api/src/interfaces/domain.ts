export const ACCOUNT_STATUS = {
  NOT_ACTIVATED: -1,
  ACTIVE: 0,
  LOCKED: 1,
  SUSPENDED: 2,
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export interface DeviceInfo {
  deviceType: string;
  brand: string;
  model: string;
  operatingSystem: string;
  browser: string;
}

export interface RouteInfo {
  method: string;
  path: string;
}
