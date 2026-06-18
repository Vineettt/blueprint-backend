import { User } from '@interfaces/repositories/user.repository.interface';

export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuthService {
  login(email: string, password: string, context?: LoginContext): Promise<LoginResult>;
}
