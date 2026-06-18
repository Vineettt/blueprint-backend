import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import {
  loginRequestSchema,
  loginResponseSchema,
  refreshTokenResponseSchema,
  revokeTokenResponseSchema,
  logoutResponseSchema,
  registerResponseSchema,
  registerRequestSchema,
} from '@schemas/auth/auth.schema';
import { errorResponseSchema } from '@schemas/common.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { ErrorHandler } from '@utils/error-handler';
import { getService } from '@middleware/di/service-injection.middleware';
import type { AuthService } from '@services/auth/auth.service';
import { COOKIE_NAMES, createCookieString, getCookieConfig } from '@constants/cookie.constants';
import { createSessionWithActivityUpdate } from '@repositories/auth/session.repository';
import { getSimpleClientIP } from '@utils/system/ip-extractor';
import { CookieParser } from '@utils/cookie-parser';
import type { RefreshTokenService } from '@services/auth/refresh-token.service';
import type { TokenBlacklistService } from '@services/auth/token-blacklist.service';
import type { SessionService } from '@services/auth/session.service';
import type { AppContext } from '@di/context-types';
import z from 'zod';
import { UserService } from '@services/user';

const authRoutes = createOpenAPIRouter();
type LoginRequestDTO = z.infer<typeof loginRequestSchema>;
type RegisterUserDTO = z.infer<typeof registerRequestSchema>;

const loginRoute = createTrackedRoute({
  method: 'post',
  path: '/login',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      headers: {
        'Set-Cookie': {
          description: 'Session and refresh token cookies',
          schema: {
            type: 'string',
            example: 'session_id=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=604800000',
          },
        },
      },
      content: {
        'application/json': {
          schema: loginResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const refreshTokenRoute = createTrackedRoute({
  method: 'get',
  path: '/refresh-token',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Token refreshed successfully',
      headers: {
        'Set-Cookie': {
          description: 'Refresh token cookie',
          schema: {
            type: 'string',
            example: 'refresh_token=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=604800000',
          },
        },
      },
      content: {
        'application/json': {
          schema: refreshTokenResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const revokeTokenRoute = createTrackedRoute({
  method: 'get',
  path: '/refresh-token/revoke',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Token revoked successfully',
      headers: {
        'Set-Cookie': {
          description: 'Clear refresh token cookie',
          schema: {
            type: 'string',
            example: 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
          },
        },
      },
      content: {
        'application/json': {
          schema: revokeTokenResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const logoutRoute = createTrackedRoute({
  method: 'get',
  path: '/logout',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Logout successful',
      headers: {
        'Set-Cookie': {
          description: 'Clear session and refresh token cookies',
          schema: {
            type: 'string',
            example:
              'session_id=; HttpOnly; Secure; SameSite=Strict; Max-Age=0, refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
          },
        },
      },
      content: {
        'application/json': {
          schema: logoutResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const RegisterRoute = createTrackedRoute({
  method: 'post',
  path: '/register',
  tags: ['Authentication'],
   request: {
    body: {
      content: {
        'application/json': {
          schema: registerRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: registerResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const loginHandler = async (c: AppContext) => {
  try {
    const { email, password } = c.get('validatedBody') as LoginRequestDTO;
    const authService = getService<AuthService>(c, 'authService');
    const refreshTokenService = getService<RefreshTokenService>(c, 'refreshTokenService');

    const result = await authService.login(email, password, {
      ipAddress: getSimpleClientIP(c),
      userAgent: c.req.header('user-agent'),
    });

    if (!result.success) {
      const statusCode = ['EMAIL_INCORRECT', 'PASSWORD_INCORRECT', 'ACCOUNT_LOCKED'].includes(
        result.error || ''
      )
        ? 401
        : 400;
      return c.json({ success: false, message: result.message, error: result.error }, statusCode);
    }

    let sessionId: string | null = null;
    if (result.user?.id) {
      sessionId = await createSessionWithActivityUpdate(
        result.user.id,
        getSimpleClientIP(c),
        c.req.header('user-agent')
      );
    }

    const refreshTokenData = await refreshTokenService.createRefreshToken(
      result.user?.id || '',
      sessionId || ''
    );

    if (refreshTokenData) {
      const refreshTokenCookie = createCookieString(
        COOKIE_NAMES.REFRESH_TOKEN,
        refreshTokenData.token,
        getCookieConfig()
      );
      c.header('Set-Cookie', refreshTokenCookie);
    }

    if (sessionId) {
      const sessionIdCookie = createCookieString(
        COOKIE_NAMES.SESSION_ID,
        sessionId,
        getCookieConfig()
      );
      c.header('Set-Cookie', sessionIdCookie, { append: true });
    }

    return c.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            email: result.user?.email,
            first_name: result.user?.firstName,
            last_name: result.user?.lastName,
            roles: result.user?.roles,
            permissions: result.user?.permissions,
          },
          token: result.token,
        },
      },
      200
    );
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Login');
  }
};

const refreshTokenHandler = async (c: AppContext) => {
  const refreshToken = CookieParser.getRefreshToken(c);

  if (!refreshToken) {
    return ResponseBuilder.unauthorized(c, 'Refresh token required', 'MISSING_REFRESH_TOKEN');
  }

  const sessionId = CookieParser.getSessionId(c);

  try {
    const refreshTokenService = getService<RefreshTokenService>(c, 'refreshTokenService');
    const result = await refreshTokenService.refreshAccessToken(refreshToken, sessionId);

    if (!result) {
      return ResponseBuilder.unauthorized(
        c,
        'Invalid or expired refresh token',
        'INVALID_REFRESH_TOKEN'
      );
    }

    const refreshTokenCookie = createCookieString(
      COOKIE_NAMES.REFRESH_TOKEN,
      result.newRefreshToken.token,
      getCookieConfig()
    );
    c.header('Set-Cookie', refreshTokenCookie);

    return ResponseBuilder.success(c, 'Token refreshed successfully', {
      token: result.newAccessToken,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Token refresh');
  }
};

const revokeRefreshTokenHandler = async (c: AppContext) => {
  const refreshToken = CookieParser.getRefreshToken(c);
  const sessionId = CookieParser.getSessionId(c);

  if (!refreshToken) {
    return ResponseBuilder.unauthorized(c, 'Refresh token required', 'MISSING_REFRESH_TOKEN');
  }

  try {
    const refreshTokenService = getService<RefreshTokenService>(c, 'refreshTokenService');
    await refreshTokenService.revokeRefreshToken(refreshToken);

    if (sessionId) {
      const sessionService = getService<SessionService>(c, 'sessionService');
      await sessionService.deactivateSessionById(sessionId);
    }

    return ResponseBuilder.success(c, 'Refresh token revoked successfully');
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Token revocation');
  }
};

const logoutHandler = async (c: AppContext) => {
  const authHeader = c.req.header('Authorization');
  const refreshToken = CookieParser.getRefreshToken(c);
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!refreshToken) {
    return ResponseBuilder.error(c, 'Refresh token required', 'MISSING_REFRESH_TOKEN');
  }

  try {
    const decoded = c.get('user') as { key: string } | null;
    const userId = decoded?.key || '';
    const sessionId = CookieParser.getSessionId(c);

    const tokenBlacklistService = getService<TokenBlacklistService>(c, 'tokenBlacklistService');
    const refreshTokenService = getService<RefreshTokenService>(c, 'refreshTokenService');
    const sessionService = getService<SessionService>(c, 'sessionService');

    if (accessToken) {
      await tokenBlacklistService.blacklistToken(accessToken);
    }

    if (userId && refreshToken) {
      await refreshTokenService.revokeRefreshToken(refreshToken);
    }

    if (sessionId) {
      await sessionService.deactivateSessionById(sessionId);
    }

    const clearRefreshTokenCookie = createCookieString(
      COOKIE_NAMES.REFRESH_TOKEN,
      '',
      getCookieConfig(),
      0
    );
    c.header('Set-Cookie', clearRefreshTokenCookie);

    const clearSessionIdCookie = createCookieString(
      COOKIE_NAMES.SESSION_ID,
      '',
      getCookieConfig(),
      0
    );
    c.header('Set-Cookie', clearSessionIdCookie, { append: true });

    return ResponseBuilder.success(c, 'Logout successful');
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Logout');
  }
};

const RegisterHandler = async (c: AppContext) => {
  const { email, password, first_name, last_name } = c.get('validatedBody') as RegisterUserDTO;

  try {
    const userService = getService<UserService>(c, 'userService');
    const result = await userService.registerUser({
      email,
      password,
      firstName: first_name,
      lastName: last_name,
    });

    if (result && 'success' in result && result.success === false) {
      return ResponseBuilder.error(c, result.message, result.error);
    }

    const userResult = result as { id: string; email: string };
    return ResponseBuilder.created(c, 'User registered successfully', {
      userId: userResult.id,
      email: userResult.email,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'User registration');
  }
}

authRoutes.openapi(loginRoute, loginHandler);
authRoutes.openapi(refreshTokenRoute, refreshTokenHandler);
authRoutes.openapi(revokeTokenRoute, revokeRefreshTokenHandler);
authRoutes.openapi(logoutRoute, logoutHandler);
authRoutes.openapi(RegisterRoute, RegisterHandler);

export default authRoutes;
