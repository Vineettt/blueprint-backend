import { Context } from 'hono';
import type { AuthService } from '@services/auth/auth.service';
import type { RefreshTokenService } from '@services/auth/refresh-token.service';
import type { PasswordService } from '@services/auth/password.service';
import type { EmailService } from '@services/email/email.service';
import type { AccountService } from '@services/auth/account.service';
import type { UserService } from '@services/user/user.service';
import type { PbacService } from '@services/pbac/pbac.service';
import type { TokenBlacklistService } from '@services/auth/token-blacklist.service';
import type { SessionService } from '@services/auth/session.service';
import type { RouteAccessService } from '@services/pbac/route-access.service';

export interface AppContext extends Context {
  get: {
    (key: 'authService'): AuthService;
    (key: 'refreshTokenService'): RefreshTokenService;
    (key: 'passwordService'): PasswordService;
    (key: 'emailService'): EmailService;
    (key: 'accountService'): AccountService;
    (key: 'userService'): UserService;
    (key: 'pbacService'): PbacService;
    (key: 'tokenBlacklistService'): TokenBlacklistService;
    (key: 'sessionService'): SessionService;
    (key: 'routeAccessService'): RouteAccessService;
    (key: 'user'): { key: string; roles: string[] } | null;
    (key: 'validatedBody'): unknown;
    (key: string): unknown;
  };
}

export interface AppEnv {
  Variables: {
    authService: AuthService;
    refreshTokenService: RefreshTokenService;
    passwordService: PasswordService;
    emailService: EmailService;
    accountService: AccountService;
    userService: UserService;
    pbacService: PbacService;
    tokenBlacklistService: TokenBlacklistService;
    sessionService: SessionService;
    routeAccessService: RouteAccessService;
    user: { key: string; roles: string[] } | null;
    validatedBody: unknown;
  };
}
