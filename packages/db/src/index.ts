import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as authSchema from './auth';
import * as pbacSchema from './pbac';

const authPool = new Pool({
  connectionString: process.env.DB_AUTH_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

authPool.on('error', err => {
  // eslint-disable-next-line no-console
  console.error('Auth database pool error:', err);
});

export const authDb = drizzle(authPool, { schema: authSchema });

const pbacPool = new Pool({
  connectionString: process.env.DB_PBAC_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pbacPool.on('error', err => {
  // eslint-disable-next-line no-console
  console.error('PBAC database pool error:', err);
});

export const pbacDb = drizzle(pbacPool, { schema: pbacSchema });

export const users = authSchema.users;
export const emailVerificationTokens = authSchema.emailVerificationTokens;
export const passwordResetTokens = authSchema.passwordResetTokens;
export const loginAttempts = authSchema.loginAttempts;
export const roles = pbacSchema.roles;
export const userRoleMappings = pbacSchema.userRoleMappings;
export const roleRouteMappings = pbacSchema.roleRouteMappings;
export const routes = pbacSchema.routes;
