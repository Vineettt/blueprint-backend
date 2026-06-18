export const COOKIE_NAMES = {
  SESSION_ID: 'session_id',
  REFRESH_TOKEN: 'refresh_token',
} as const;

type CookieEnv = 'dev' | 'staging' | 'prod';

const cookieConfigMap = {
  dev: {
    domain: process.env.COOKIE_DOMAIN,
    secure: false,
    httpOnly: true,
    sameSite: 'Lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
  staging: {
    domain: process.env.COOKIE_DOMAIN,
    secure: true,
    httpOnly: true,
    sameSite: 'None' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
  prod: {
    domain: process.env.COOKIE_DOMAIN,
    secure: true,
    httpOnly: true,
    sameSite: 'None' as const,
    maxAge: 60 * 60 * 24 * 30,
  },
} as const;

export const getCookieConfig = () => {
  const env = (process.env.COOKIE_ENV ?? 'dev') as CookieEnv;

  return cookieConfigMap[env];
};

export const createCookieString = (
  name: string,
  value: string,
  config: {
    domain?: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'Lax' | 'Strict' | 'None';
    maxAge: number;
  },
  maxAge?: number
) => {
  const parts = [`${name}=${value}`];

  if (config.httpOnly) parts.push('HttpOnly');
  if (config.secure) parts.push('Secure');
  if (config.domain) parts.push(`Domain=${config.domain}`);
  parts.push(`SameSite=${config.sameSite}`);
  parts.push('Path=/');
  parts.push(`Max-Age=${maxAge ?? config.maxAge}`);
  return parts.join('; ');
};
