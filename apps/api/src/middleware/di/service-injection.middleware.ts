import { Context, Next } from 'hono';
import { container } from '@di/container';
import { DI_TOKENS } from '@di/tokens';

const SERVICE_TOKEN_MAP: Record<string, string> = {
  authService: DI_TOKENS.IAuthService,
  refreshTokenService: DI_TOKENS.IRefreshTokenService,
  passwordService: DI_TOKENS.IPasswordService,
  emailService: DI_TOKENS.IEmailService,
  accountService: DI_TOKENS.IAccountService,
  userService: DI_TOKENS.IUserService,
  pbacService: DI_TOKENS.IPbacService,
  tokenBlacklistService: DI_TOKENS.ITokenBlacklistService,
  sessionService: DI_TOKENS.ISessionService,
  routeAccessService: DI_TOKENS.IRouteAccessService,
};

export const serviceInjectionMiddleware = async (c: Context, next: Next) => {
  for (const [name, token] of Object.entries(SERVICE_TOKEN_MAP)) {
    const instance = container.resolve(token);
    c.set(name, instance);
  }
  await next();
};

export const getService = <T>(c: Context, serviceName: string): T => {
  return c.get(serviceName) as T;
};
