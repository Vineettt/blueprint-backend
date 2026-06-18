import 'reflect-metadata';
import { container } from 'tsyringe';
import { DI_TOKENS } from './tokens';
import { EmailService } from '@services/email/email.service';
import { UserService } from '@services/user/user.service';
import { AccountService } from '@services/auth/account.service';
import { AuthService } from '@services/auth/auth.service';
import { PasswordService } from '@services/auth/password.service';
import { RefreshTokenService } from '@services/auth/refresh-token.service';
import { SessionService } from '@services/auth/session.service';
import {
  TokenBlacklistService,
  DatabaseTokenBlacklist,
} from '@services/auth/token-blacklist.service';
import { RouteAccessService } from '@services/pbac/route-access.service';
import { PbacService } from '@services/pbac/pbac.service';
import { RoleService } from '@services/pbac/role.service';
import { RouteService } from '@services/pbac/route.service';
import { RoleRouteMappingService } from '@services/pbac/role-route-mapping.service';
import { UserRoleMappingService } from '@services/pbac/user-role-mapping.service';
import { RouteCacheService } from '@services/pbac/route-cache.service';
import { RouteSyncService } from '@services/pbac/route-sync.service';

container.registerSingleton(DI_TOKENS.IEmailService, EmailService);
container.registerSingleton(DI_TOKENS.IUserService, UserService);
container.registerSingleton(DI_TOKENS.IAccountService, AccountService);
container.registerSingleton(DI_TOKENS.IAuthService, AuthService);
container.registerSingleton(DI_TOKENS.IPasswordService, PasswordService);
container.registerSingleton(DI_TOKENS.IRefreshTokenService, RefreshTokenService);
container.registerSingleton(DI_TOKENS.ISessionService, SessionService);
container.registerSingleton(DI_TOKENS.ITokenBlacklistService, TokenBlacklistService);
container.registerSingleton(DatabaseTokenBlacklist);

container.registerSingleton(RoleService);
container.registerSingleton(RouteService);
container.registerSingleton(RoleRouteMappingService);
container.registerSingleton(UserRoleMappingService);

container.registerSingleton(DI_TOKENS.IRouteAccessService, RouteAccessService);
container.registerSingleton(DI_TOKENS.IPbacService, PbacService);
container.registerSingleton(DI_TOKENS.IRouteCacheService, RouteCacheService);
container.registerSingleton(DI_TOKENS.IRouteSyncService, RouteSyncService);

export { container };
