import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    firstName: varchar('first_name'),
    lastName: varchar('last_name'),
    email: varchar('email').notNull(),
    password: varchar('password').notNull(),
    accountLockedUntil: timestamp('account_locked_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    status: integer('status').default(-1)
  },
  table => [
    index('idx_users_first_name').on(table.firstName),
    index('idx_users_last_name').on(table.lastName),
    index('idx_users_account_locked_until').on(table.accountLockedUntil),
    uniqueIndex('idx_users_email_unique_active')
      .on(table.email)
      .where(sql`deleted_at IS NULL`),
  ]
);

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userFkId: uuid('user_fk_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    deviceInfo: jsonb('device_info')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    loginTime: timestamp('login_time', { withTimezone: true }).defaultNow().notNull(),
    logoutTime: timestamp('logout_time', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    failedAttempts: integer('failed_attempts').default(0).notNull(),
    lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('idx_user_sessions_user_active_last_activity').on(
      table.userFkId,
      table.isActive,
      table.lastActivity
    ),
    index('idx_user_sessions_device_info').using('gin', table.deviceInfo),
  ]
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userFkId: uuid('user_fk_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionFkId: uuid('session_fk_id')
      .notNull()
      .references(() => userSessions.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  table => [
    index('idx_refresh_tokens_session_fk').on(table.sessionFkId),
    index('idx_refresh_tokens_user_active_expiry').on(
      table.userFkId,
      table.isActive,
      table.expiresAt
    ),
  ]
);

export const tokenBlacklist = pgTable(
  'token_blacklist',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiryTimestamp: timestamp('expiry_timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [index('idx_token_blacklist_expiry').on(table.expiryTimestamp)]
);

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userFkId: uuid('user_fk_id').references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    remark: varchar('remark'),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('idx_login_attempts_user').on(table.userFkId),
    index('idx_login_attempts_ip').on(table.ipAddress),
    index('idx_login_attempts_email_attempted_at').on(table.attemptedAt, table.email),
  ]
);

export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userFkId: uuid('user_fk_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('idx_email_verification_user').on(table.userFkId),
    index('idx_email_verification_expiry').on(table.expiresAt),
  ]
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userFkId: uuid('user_fk_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('idx_password_reset_user').on(table.userFkId),
    index('idx_password_reset_expiry').on(table.expiresAt),
  ]
);

export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type TokenBlacklist = typeof tokenBlacklist.$inferSelect;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
