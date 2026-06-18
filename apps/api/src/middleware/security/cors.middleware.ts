import { cors } from 'hono/cors';
import { config } from '@blueprint/config';

export const corsMiddleware = cors({
  origin: config.server.corsOrigin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
});
