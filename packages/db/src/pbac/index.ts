import { pgTable, uuid, timestamp, varchar, integer, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roles = pgTable('roles', {
  id: uuid('id')
    .default(sql`uuidv7()`)
    .primaryKey(),
  name: varchar('name').unique().notNull(),
  description: varchar('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const routes = pgTable(
  'routes',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    endpoint: varchar('endpoint').notNull(),
    method: varchar('method').notNull(),
    status: integer('status').default(-1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  table => [unique('idx_routes_endpoint_method_unique').on(table.endpoint, table.method)]
);

export const roleRouteMappings = pgTable(
  'role_route_mappings',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    roleFkId: uuid('role_fk_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    routeFkId: uuid('route_fk_id')
      .notNull()
      .references(() => routes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  table => [
    unique('idx_role_route_mappings_unique').on(table.roleFkId, table.routeFkId),
    index('idx_role_route_mappings_route_fk').on(table.routeFkId),
  ]
);

export const userRoleMappings = pgTable(
  'user_role_mappings',
  {
    id: uuid('id')
      .default(sql`uuidv7()`)
      .primaryKey(),
    userFkId: uuid('user_fk_id').notNull(),
    roleFkId: uuid('role_fk_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  table => [
    unique('idx_user_role_mappings_unique').on(table.userFkId, table.roleFkId),
    index('idx_user_role_mappings_role_fk').on(table.roleFkId),
  ]
);

export type RoleRouteMapping = typeof roleRouteMappings.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserRoleMapping = typeof userRoleMappings.$inferSelect;
export type Route = typeof routes.$inferSelect;
