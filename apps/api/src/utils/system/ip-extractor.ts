import { Context } from 'hono';

export const getSimpleClientIP = (c: Context): string => {
  return c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
};
