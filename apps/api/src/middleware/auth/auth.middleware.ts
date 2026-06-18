import { verifyJwt } from '@utils/auth/jwt';
import { logger } from '@blueprint/logger';
import { getSimpleClientIP } from '@utils/system/ip-extractor';
import { config } from '@blueprint/config';
import { findUserById } from '@repositories/auth/user.repository';
import { updateSessionLastActivity } from '@repositories/auth/session.repository';
import { ACCOUNT_STATUS } from '@interfaces/domain';
import type { RouteAccessService } from '@services/pbac/route-access.service';
import type { TokenBlacklistService } from '@services/auth/token-blacklist.service';
import { getService } from '@middleware/di/service-injection.middleware';
import { Context, Next } from 'hono';
import { CookieParser } from '../../utils/cookie-parser';

const authMiddleware = async (c: Context, next: Next) => {
  try {
    const method = c.req.method;
    const endpoint = c.req.path;
    const ip = getSimpleClientIP(c);

    if (method === 'GET' && endpoint === '/api/session') {
      await next();
      return;
    }

    const routeAccessService = getService<RouteAccessService>(c, 'routeAccessService');
    const routeAccess = await routeAccessService.checkRouteAccess(endpoint, method);

    if (!routeAccess.routeId) {
      logger.warn('Route not found', {
        endpoint,
        method,
        ip,
        cacheKey: `${method}:${endpoint}`,
        timestamp: new Date().toISOString(),
      });
      return c.json(
        {
          success: false,
          message: 'Route not found',
          error: 'ROUTE_NOT_FOUND',
          details: { endpoint, method },
        },
        404
      );
    }

    if (routeAccess.status === -1) {
      logger.warn('Route method not found', { endpoint, method, ip });
      return c.json(
        {
          success: false,
          message: 'Route method not found - configuration required',
          error: 'ROUTE_METHOD_NOT_FOUND',
        },
        404
      );
    }

    if (routeAccess.status === 0) {
      logger.info('Public route access', { endpoint, method, ip });
      await next();
      return;
    }

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      logger.warn('Missing token', { endpoint, method, ip });
      return c.json(
        {
          success: false,
          message: 'Authorization token required',
          error: 'MISSING_TOKEN',
        },
        401
      );
    }

    let token: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }

    if (!token) {
      logger.warn('Invalid token format', { endpoint, method, ip });
      return c.json(
        {
          success: false,
          message: 'Invalid token format',
          error: 'INVALID_TOKEN_FORMAT',
        },
        401
      );
    }

    const tokenBlacklistService = getService<TokenBlacklistService>(c, 'tokenBlacklistService');
    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('Token is blacklisted', { endpoint, method, ip });
      return c.json(
        {
          success: false,
          message: 'Token has been revoked',
          error: 'TOKEN_REVOKED',
        },
        401
      );
    }

    let decoded: { key: string; roles: string[] };
    try {
      decoded = (await verifyJwt(token, config.jwt.secret)) as unknown as {
        key: string;
        roles: string[];
      };
    } catch (err: unknown) {
      logger.error('Token verification failed', err);
      let errorMessage = 'Token verification failed';
      if (err && typeof err === 'object' && 'name' in err) {
        if (err.name === 'TokenExpiredError') {
          errorMessage = 'Token has expired';
        } else if (err.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid token';
        }
      }

      logger.warn('Token verification failed', { error: errorMessage, endpoint, method, ip });
      return c.json(
        {
          success: false,
          message: errorMessage,
          error: 'TOKEN_VERIFICATION_FAILED',
        },
        401
      );
    }

    const user = await findUserById(decoded.key);
    if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) {
      return c.json(
        {
          success: false,
          message: 'User account is not active',
          error: 'USER_NOT_ACTIVE',
        },
        403
      );
    }

    c.set('user', decoded);

    const sessionId = CookieParser.getSessionId(c);
    if (sessionId) {
      updateSessionLastActivity(sessionId);
    }

    const userId = decoded.key ? String(decoded.key) : '';
    const userRoles = decoded.roles || [];

    const hasAccess = Array.isArray(routeAccess.authorizedRoles)
      ? routeAccess.authorizedRoles.some((roleId: string) => userRoles.includes(roleId))
      : false;

    if (!hasAccess) {
      const authorizedRoles = Array.isArray(routeAccess.authorizedRoles)
        ? routeAccess.authorizedRoles
        : [];

      logger.warn('Insufficient permissions', {
        userId,
        endpoint,
        method,
        userRoles: userRoles,
        requiredRoles: authorizedRoles,
        ip,
      });

      return c.json(
        {
          success: false,
          message: 'Access denied - insufficient permissions',
          error: 'INSUFFICIENT_PERMISSIONS',
        },
        403
      );
    }

    logger.info('Access granted', {
      userId,
      endpoint,
      method,
      userRoles: userRoles,
      ip,
    });

    await next();
  } catch (error: unknown) {
    logger.error('Auth middleware error', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error',
        error: 'AUTH_MIDDLEWARE_ERROR',
      },
      500
    );
  }
};

export default authMiddleware;
