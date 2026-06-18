import { Context } from 'hono';
import { getCookie } from 'hono/cookie';

export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'refresh_token',
  SESSION_ID: 'session_id',
} as const;

export class CookieParser {
  static getCookie(c: Context, name: string): string | undefined {
    return getCookie(c, name);
  }

  static getRefreshToken(c: Context): string | undefined {
    return getCookie(c, COOKIE_NAMES.REFRESH_TOKEN);
  }

  static getSessionId(c: Context): string | undefined {
    return getCookie(c, COOKIE_NAMES.SESSION_ID);
  }

  static getAllCookies(c: Context): Record<string, string> {
    return getCookie(c);
  }
}
