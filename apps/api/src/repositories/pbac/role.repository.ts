import { pbacDb, roles, userRoleMappings, roleRouteMappings } from '@blueprint/db';
import { eq, inArray, sql } from 'drizzle-orm';
import { SearchValidator, searchSchema } from '@schemas/search.schema';

export const createRoleMapping = async (userId: string, roleName: string) => {
  const role = await pbacDb.select().from(roles).where(eq(roles.name, roleName)).limit(1);

  if (!role.length) {
    return false;
  }

  await pbacDb.insert(userRoleMappings).values({
    userFkId: userId,
    roleFkId: role[0].id,
  });

  return true;
};

export const createRole = async (roleData: { name: string; description?: string }) => {
  const result = await pbacDb.insert(roles).values(roleData).returning();

  return result[0];
};

export const createRolesBulk = async (rolesData: { name: string; description?: string }[]) => {
  const result = await pbacDb.insert(roles).values(rolesData).returning();

  return result;
};

export const getAllRoles = async () => {
  const roleList = await pbacDb
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
    })
    .from(roles);
  return roleList;
};

export const deleteRoles = async (roleIds: string[]) => {
  await pbacDb.delete(roles).where(inArray(roles.id, roleIds));
  return true;
};

export const updateRoles = async (roleUpdates: { id: string; name: string }[]) => {
  if (roleUpdates.length === 0) return true;

  const caseParts = roleUpdates.map(role => sql`WHEN ${roles.id} = ${role.id} THEN ${role.name}`);
  const caseStatement = sql.join(caseParts, sql` `);

  await pbacDb.execute(sql`
    UPDATE roles
    SET name = CASE ${caseStatement} END
    WHERE ${inArray(
      roles.id,
      roleUpdates.map(role => role.id)
    )}
  `);

  return true;
};

export const searchRolesWithCount = async (search: string, limit: number, offset: number) => {
  const validatedSearch = SearchValidator.validateSearch(search, searchSchema);

  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
  const safeOffset = Number(offset) >= 0 ? Number(offset) : 0;

  const searchPattern = validatedSearch?.pattern || '%%';

  const dataQuery = pbacDb.execute(sql`
    SELECT id, name, description
    FROM roles
    WHERE name ILIKE ${searchPattern}
    ORDER BY id
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `);

  const countQuery = pbacDb.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM roles
    WHERE name ILIKE ${searchPattern}
  `);

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  return {
    payload: dataResult.rows,
    total: countResult.rows[0]?.total ?? 0,
  };
};

export const checkRoleRouteMappings = async (
  roleIds: string[]
): Promise<{ hasMappings: boolean; count: number }> => {
  const result = await pbacDb
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(roleRouteMappings)
    .where(inArray(roleRouteMappings.roleFkId, roleIds));

  const countValue = result[0]?.count ?? 0;

  return {
    hasMappings: countValue > 0,
    count: countValue,
  };
};

export const checkUserRoleMappings = async (
  roleIds: string[]
): Promise<{ hasMappings: boolean; count: number }> => {
  const result = await pbacDb
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(userRoleMappings)
    .where(inArray(userRoleMappings.roleFkId, roleIds));

  const countValue = result[0]?.count ?? 0;

  return {
    hasMappings: countValue > 0,
    count: countValue,
  };
};
