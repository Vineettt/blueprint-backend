import { pbacDb, routes, userRoleMappings, roleRouteMappings, authDb } from '@blueprint/db';
import { eq, inArray, sql } from 'drizzle-orm';
import { SearchValidator, searchSchema } from '@schemas/search.schema';
import { UserRoleMappingWithCount } from '@interfaces/repositories/pbac.repository.interface';

interface UserRow {
  id: string;
  email: string;
  total_count: number;
}

interface RoleMappingRow {
  id: string;
  user_fk_id: string;
  role_fk_id: string;
  name: string;
}

export const getAllRoutes = async () => {
  const routeList = await pbacDb.select().from(routes);
  return routeList;
};

export const searchRoutesWithCount = async (search: string, limit: number, offset: number) => {
  const validatedSearch = SearchValidator.validateSearch(search, searchSchema);

  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
  const safeOffset = Number(offset) >= 0 ? Number(offset) : 0;

  const searchPattern = validatedSearch?.pattern || '%%';

  const whereClause = sql`
    WHERE endpoint ILIKE ${searchPattern}
  `;

  const dataQuery = pbacDb.execute(sql`
    SELECT id, 
      method, 
      endpoint, 
      status, 
      CASE status
        WHEN -1 THEN 'Configuration Required'
        WHEN 0 THEN 'Public'
        WHEN 1 THEN 'Private'
        ELSE 'UNKNOWN'
      END AS access
    FROM routes
    ${searchPattern === '%%' ? sql`` : whereClause}
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `);

  const countQuery = pbacDb.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM routes
    ${searchPattern === '%%' ? sql`` : whereClause}
  `);

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  return {
    payload: dataResult.rows,
    total: countResult.rows[0]?.total ?? 0,
  };
};

export const updateRoutes = async (routeUpdates: { id: string; status: number }[]) => {
  if (!routeUpdates.length) return true;

  const caseParts = routeUpdates.map(
    route => sql`WHEN ${routes.id} = ${route.id} THEN ${route.status}`
  );

  const caseStatement = sql.join(caseParts, sql` `);

  await pbacDb.execute(sql`
    UPDATE routes
    SET status = (
      CASE ${caseStatement} END
    )::integer
    WHERE ${inArray(
      routes.id,
      routeUpdates.map(r => r.id)
    )}
  `);

  return true;
};

export const getRoutesByRole = async (
  roleId: string,
  status: number[],
  unassignedOnly: boolean
) => {
  const statusSql = sqlStatus(status);

  const result = await pbacDb.execute(sql`
    SELECT
      r.id,
      r.endpoint,
      r.method,
      r.status,
      r.created_at,
      r.updated_at,
      CASE
        WHEN rrm.role_fk_id IS NULL THEN false
        ELSE true
      END AS is_assigned
    FROM routes r
    LEFT JOIN role_route_mappings rrm
      ON rrm.route_fk_id = r.id
      AND rrm.role_fk_id = ${roleId}
    WHERE r.status IN (${statusSql})
      AND (
        ${unassignedOnly ? sql`rrm.role_fk_id IS NULL` : sql`rrm.role_fk_id IS NOT NULL`}
      )
    ORDER BY r.endpoint, r.method
  `);

  return result.rows;
};

export const createRoleRouteMappings = async (mappings: { roleId: string; routeId: string }[]) => {
  const mappingData = mappings.map(mapping => ({
    roleFkId: mapping.roleId,
    routeFkId: mapping.routeId,
  }));

  await pbacDb.insert(roleRouteMappings).values(mappingData);
  return true;
};

export const deleteRoleRouteMappings = async (mappingIds: string[]) => {
  await pbacDb.delete(roleRouteMappings).where(inArray(roleRouteMappings.id, mappingIds));
  return true;
};

export const getRoleRouteMappings = async (
  search: string,
  role: string,
  limit: number,
  offset: number,
  status: number[]
) => {
  const validatedSearch = SearchValidator.validateSearch(search, searchSchema);

  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
  const safeOffset = Number(offset) >= 0 ? Number(offset) : 0;

  const searchPattern = validatedSearch?.pattern || '%%';

  const statusSql = sqlStatus(status);

  const dataQuery = pbacDb.execute(sql`
    SELECT
      rrm.id,
      rrm.role_fk_id as "roleId",
      rrm.route_fk_id as "routeId",
      r.name as "name",
      rt.endpoint,
      rt.method,
      CASE rt.status
        WHEN -1 THEN 'Configuration Required'
        WHEN 0 THEN 'Public'
        WHEN 1 THEN 'Private'
        ELSE 'UNKNOWN'
      END AS access
    FROM role_route_mappings rrm
    INNER JOIN roles r ON rrm.role_fk_id = r.id
    INNER JOIN routes rt ON rrm.route_fk_id = rt.id
    WHERE rrm.role_fk_id = ${role}
      AND rt.endpoint ILIKE ${searchPattern} and rt.status IN (${statusSql})
    ORDER BY rrm.id
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `);

  const countQuery = pbacDb.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM role_route_mappings rrm
    INNER JOIN routes rt ON rrm.route_fk_id = rt.id
    WHERE rrm.role_fk_id = ${role}
      AND rt.endpoint ILIKE ${searchPattern} and rt.status IN (${statusSql})
  `);

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  return {
    data: dataResult.rows,
    total: countResult.rows[0]?.total ?? 0,
  };
};

export const deleteUserRoleMappings = async (mappingIds: string[]) => {
  await pbacDb.delete(userRoleMappings).where(inArray(userRoleMappings.id, mappingIds));
  return true;
};

export const insertUserRoleMappings = async (
  mappings: { userFkId: string; roleFkId: string }[]
) => {
  await pbacDb.insert(userRoleMappings).values(mappings).onConflictDoNothing();
  return true;
};

export const getUserRoleMappings = async (search: string, limit: number, offset: number) => {
  const validatedSearch = SearchValidator.validateSearch(search, searchSchema);

  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
  const safeOffset = Number(offset) >= 0 ? Number(offset) : 0;

  const searchPattern = validatedSearch?.pattern || '%%';

  const whereClause = searchPattern !== '%%' ? sql`WHERE email ILIKE ${searchPattern}` : sql``;

  const authResult = await authDb.execute(sql`
    SELECT
      id,
      email
    FROM users
    ${whereClause}
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
  `);

  const countResult = await authDb.execute(sql`
    SELECT COUNT(*) as total
    FROM users
    ${whereClause}
  `);

  const total = Number(countResult.rows[0].total);

  const users = authResult.rows as unknown as UserRow[];

  const userIds = users.map(u => u.id);

  if (userIds.length === 0) {
    return {
      total,
      data: [],
    };
  }

  const result = await pbacDb.execute(sql`
    SELECT
      urm.id,
      urm.user_fk_id,
      urm.role_fk_id,
      r.name as "name"
    FROM user_role_mappings urm
    INNER JOIN roles r ON urm.role_fk_id = r.id
    WHERE urm.user_fk_id IN (${sql.join(userIds, sql`, `)})
  `);

  const roleMappings = result.rows as unknown as RoleMappingRow[];

  const mappingsByUser = new Map<string, RoleMappingRow[]>();

  for (const rm of roleMappings) {
    if (!mappingsByUser.has(rm.user_fk_id)) {
      mappingsByUser.set(rm.user_fk_id, []);
    }

    mappingsByUser.get(rm.user_fk_id)?.push(rm);
  }

  const data = users.map(user => {
    const userMappings = mappingsByUser.get(user.id) || [];

    return {
      id: user.id,
      user_fk_id: user.id,
      email: user.email,
      roles: userMappings.map(rm => rm.name).join(', '),
    } as UserRoleMappingWithCount;
  });

  return {
    total,
    data,
  };
};

export const getUserRoleMappingsByUserId = async (userFkId: string) => {
  return await pbacDb
    .select()
    .from(userRoleMappings)
    .where(eq(userRoleMappings.userFkId, userFkId));
};

const sqlStatus = (status: number[]) => {
  return sql.join(
    status.map(s => sql`${s}`),
    sql`, `
  );
};
