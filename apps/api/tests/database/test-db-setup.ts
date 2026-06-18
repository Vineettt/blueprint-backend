import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import { eq } from 'drizzle-orm';

import * as authSchema from '../../src/db/auth';
import * as pbacSchema from '../../src/db/pbac';

import { 
  sqliteTable, 
  text, 
  integer, 
  blob,
  index,
  unique
} from 'drizzle-orm/sqlite-core';

// SQLite Auth Schema
export const testUsers = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  resetToken: text('reset_token'),
  resetStatus: integer('reset_status').default(0),
  token: text('token'),
  loginAttempts: integer('login_attempts').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  status: integer('status').default(-1),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  firstNameIdx: index('idx_users_first_name').on(table.firstName),
  lastNameIdx: index('idx_users_last_name').on(table.lastName),
}));

export const testRefreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userFkId: text('user_fk_id').notNull(),
  tokenHash: text('token_hash', { length: 64 }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull().default(new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
}, (table) => ({
  tokenHashUnique: unique().on(table.tokenHash),
  tokenHashIdx: index('idx_refresh_tokens_hash').on(table.tokenHash),
  userFkActiveIdx: index('idx_refresh_tokens_user_fk_active').on(table.userFkId, table.isActive),
  userFkActiveExpiryIdx: index('idx_refresh_tokens_user_active_expiry').on(
    table.userFkId,
    table.isActive,
    table.expiresAt
  ),
}));

export const testUserSessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userFkId: text('user_fk_id').notNull(),
  ipAddress: text('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  deviceInfo: text('device_info'), // JSON as text in SQLite
  loginTime: integer('login_time', { mode: 'timestamp' }).default(new Date()).notNull(),
  logoutTime: integer('logout_time', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  failedAttempts: integer('failed_attempts').default(0).notNull(),
  lastActivity: integer('last_activity', { mode: 'timestamp' }).default(new Date()).notNull(),
}, (table) => ({
  userFkActiveIdx: index('idx_user_sessions_user_fk_active').on(table.userFkId, table.isActive),
  userFkActiveLastActivityIdx: index('idx_user_sessions_user_active_last_activity').on(
    table.userFkId,
    table.isActive,
    table.lastActivity
  ),
}));

export const testTokenBlacklist = sqliteTable('token_blacklist', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tokenHash: text('token_hash', { length: 64 }).notNull(),
  expiryTimestamp: integer('expiry_timestamp', { mode: 'timestamp' }).notNull().default(new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()).notNull(),
}, (table) => ({
  tokenHashUnique: unique().on(table.tokenHash),
  tokenHashIdx: index('idx_token_blacklist_hash').on(table.tokenHash),
  expiryIdx: index('idx_token_blacklist_expiry').on(table.expiryTimestamp),
}));

// SQLite PBAC Schema
export const testRoles = sqliteTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('role').unique().notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()),
}, (table) => ({
  nameIdx: index('idx_roles_name').on(table.name),
}));

export const testRoutes = sqliteTable('routes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  status: integer('status').default(-1),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(new Date()),
}, (table) => ({
  endpointMethodUnique: unique().on(table.endpoint, table.method),
  endpointIdx: index('idx_routes_endpoint').on(table.endpoint),
  endpointMethodIdx: index('idx_routes_endpoint_method').on(table.endpoint, table.method),
}));

export const testUserRoleMappings = sqliteTable('user_role_mappings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userFkId: text('user_fk_id').notNull(),
  roleFkId: text('role_fk_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
}, (table) => ({
  userRoleUnique: unique().on(table.userFkId, table.roleFkId),
  userFkIdx: index('idx_user_role_mappings_user_fk').on(table.userFkId),
  roleFkIdx: index('idx_user_role_mappings_role_fk').on(table.roleFkId),
  userRoleIdx: index('idx_user_role_mappings_user_role').on(table.userFkId, table.roleFkId),
}));

export const testRoleRouteMappings = sqliteTable('role_route_mappings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roleFkId: text('role_fk_id').notNull(),
  routeFkId: text('route_fk_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
}, (table) => ({
  roleRouteUnique: unique().on(table.roleFkId, table.routeFkId),
  roleFkIdx: index('idx_role_route_mappings_role_fk').on(table.roleFkId),
  routeFkIdx: index('idx_role_route_mappings_route_fk').on(table.routeFkId),
  roleRouteIdx: index('idx_role_route_mappings_role_route').on(table.roleFkId, table.routeFkId),
}));

// Test database instances
let testAuthDb: ReturnType<typeof drizzle> | null = null;
let testPbacDb: ReturnType<typeof drizzle> | null = null;
let testAuthSqlite: Database.Database | null = null;
let testPbacSqlite: Database.Database | null = null;

const TEST_DB_PATH = path.join(__dirname, '..', '..', 'test-databases');

export const setupTestDatabases = async () => {
  // Ensure test database directory exists
  if (!fs.existsSync(TEST_DB_PATH)) {
    fs.mkdirSync(TEST_DB_PATH, { recursive: true });
  }

  // Create SQLite databases
  testAuthSqlite = new Database(path.join(TEST_DB_PATH, 'test-auth.db'));
  testPbacSqlite = new Database(path.join(TEST_DB_PATH, 'test-pbac.db'));

  // Initialize Drizzle instances
  testAuthDb = drizzle(testAuthSqlite, {
    schema: {
      users: testUsers,
      refreshTokens: testRefreshTokens,
      userSessions: testUserSessions,
      tokenBlacklist: testTokenBlacklist,
    }
  });

  testPbacDb = drizzle(testPbacSqlite, {
    schema: {
      roles: testRoles,
      routes: testRoutes,
      userRoleMappings: testUserRoleMappings,
      roleRouteMappings: testRoleRouteMappings,
    }
  });

  // Enable foreign keys
  testAuthSqlite.pragma('foreign_keys = ON');
  testPbacSqlite.pragma('foreign_keys = ON');

  return { testAuthDb, testPbacDb };
};

export const getTestDatabases = () => {
  if (!testAuthDb || !testPbacDb) {
    throw new Error('Test databases not initialized. Call setupTestDatabases() first.');
  }
  return { testAuthDb, testPbacDb };
};

export const cleanupTestDatabases = async () => {
  if (testAuthSqlite) {
    testAuthSqlite.close();
    testAuthSqlite = null;
  }
  if (testPbacSqlite) {
    testPbacSqlite.close();
    testPbacSqlite = null;
  }
  testAuthDb = null;
  testPbacDb = null;

  // Clean up test database files
  try {
    const authDbPath = path.join(TEST_DB_PATH, 'test-auth.db');
    const pbacDbPath = path.join(TEST_DB_PATH, 'test-pbac.db');
    
    if (fs.existsSync(authDbPath)) {
      fs.unlinkSync(authDbPath);
    }
    if (fs.existsSync(pbacDbPath)) {
      fs.unlinkSync(pbacDbPath);
    }
  } catch (error) {
    console.warn('Warning: Could not clean up test database files:', error);
  }
};

export const resetTestDatabases = async () => {
  const { testAuthDb, testPbacDb } = getTestDatabases();
  
  if (!testAuthDb || !testPbacDb) {
    throw new Error('Test databases not initialized');
  }

  // Clear all tables
  if (testAuthSqlite) {
    testAuthSqlite.exec('DELETE FROM token_blacklist');
    testAuthSqlite.exec('DELETE FROM user_sessions');
    testAuthSqlite.exec('DELETE FROM refresh_tokens');
    testAuthSqlite.exec('DELETE FROM users');
  }

  if (testPbacSqlite) {
    testPbacSqlite.exec('DELETE FROM role_route_mappings');
    testPbacSqlite.exec('DELETE FROM user_role_mappings');
    testPbacSqlite.exec('DELETE FROM routes');
    testPbacSqlite.exec('DELETE FROM roles');
  }
};

// Types for testing
export type TestUser = typeof testUsers.$inferSelect;
export type TestRefreshToken = typeof testRefreshTokens.$inferSelect;
export type TestUserSession = typeof testUserSessions.$inferSelect;
export type TestTokenBlacklist = typeof testTokenBlacklist.$inferSelect;
export type TestRole = typeof testRoles.$inferSelect;
export type TestRoute = typeof testRoutes.$inferSelect;
export type TestUserRoleMapping = typeof testUserRoleMappings.$inferSelect;
export type TestRoleRouteMapping = typeof testRoleRouteMappings.$inferSelect;
