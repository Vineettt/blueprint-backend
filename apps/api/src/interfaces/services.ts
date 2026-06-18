export type EmailProvider = 'smtp' | 'ses';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
}

export interface EmailTemplateOptions {
  resetUrl?: string;
  email?: string;
  activationUrl?: string;
}

export interface RefreshTokenData {
  token: string;
  expiresAt: Date;
}

export interface TokenBlacklistStore {
  set(tokenHash: string, expiry: number): Promise<void>;
  get(tokenHash: string): Promise<boolean>;
  cleanup(): Promise<void>;
}

export type RegisterUserResult = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  status: number;
} | null;
