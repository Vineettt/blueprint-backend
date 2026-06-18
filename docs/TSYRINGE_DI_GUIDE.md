# TSyringe DI Guide

This project uses [TSyringe](https://github.com/microsoft/tsyringe) for dependency injection.

## Creating a Service

Add `@injectable()` to your service class:

```typescript
import { injectable } from 'tsyringe';

@injectable()
export class MyService {
  doSomething() {}
}
```

## Constructor Injection

Use `@inject()` with a DI token for interface-bound dependencies:

```typescript
import { injectable, inject } from 'tsyringe';
import { DI_TOKENS } from '@di/tokens';
import type { IEmailService } from '@interfaces/services/email.service.interface';

@injectable()
export class MyService {
  constructor(
    @inject(DI_TOKENS.IEmailService) private emailService: IEmailService
  ) {}
}
```

For concrete class dependencies (e.g. PBAC sub-services), inject by class directly:

```typescript
import { injectable, inject } from 'tsyringe';
import { RoleService } from './role.service';

@injectable()
export class MyService {
  constructor(
    @inject(RoleService) private roleService: RoleService
  ) {}
}
```

## Resolving Services in Route Handlers

Services are injected into the Hono context by `serviceInjectionMiddleware` and resolved lazily on first access. Use `getService` to retrieve them:

```typescript
import { getService } from '@middleware/di/service-injection.middleware';
import type { UserService } from '@services/user.service';

const handler = async (c: AppContext) => {
  const userService = getService<UserService>(c, 'userService');
  const user = await userService.getUserDetails(userId);
  // ...
};
```

## Registered Services

### Auth & User

| Token | Class |
|-------|-------|
| `IEmailService` | `EmailService` |
| `IUserService` | `UserService` |
| `IAccountService` | `AccountService` |
| `IAuthService` | `AuthService` |
| `IPasswordService` | `PasswordService` |
| `IRefreshTokenService` | `RefreshTokenService` |
| `ISessionService` | `SessionService` |
| `ITokenBlacklistService` | `TokenBlacklistService` |

### PBAC Facade

| Token | Class |
|-------|-------|
| `IPbacService` | `PbacService` (delegates to sub-services below) |

### PBAC Sub-Services (registered by class, not token)

| Class | Responsibility |
|-------|---------------|
| `RoleService` | Role CRUD and search |
| `RouteService` | Route search, update, and role-based lookup |
| `RoleRouteMappingService` | Role-route mapping CRUD |
| `UserRoleMappingService` | User-role mapping insert and validation |

### Infrastructure

| Token | Class |
|-------|-------|
| `IRouteAccessService` | `RouteAccessService` |
| `IRouteCacheService` | `RouteCacheService` |
| `IRouteSyncService` | `RouteSyncService` |

## Adding a New Service

1. Create the class with `@injectable()` in `src/services/`
2. Register it in `src/di/container.ts`:
   - Use `container.registerSingleton(DI_TOKENS.IMyService, MyService)` for interface-bound services
   - Add the token to `src/di/tokens.ts`
   - Add the context type to `src/di/context-types.ts`
   - Add the service name to `SERVICE_TOKEN_MAP` in `src/middleware/di/service-injection.middleware.ts`

## Testing

Reset the container between tests:

```typescript
import { container } from 'tsyringe';

beforeEach(() => {
  container.reset();
});
```

## TypeScript Config

Required in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```
