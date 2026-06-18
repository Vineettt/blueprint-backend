import { pbacDb } from '@blueprint/db';
import { sql } from 'drizzle-orm';
import type { UserRolesAndPermissions } from '@interfaces/repositories/pbac.repository.interface';

export type { UserRolesAndPermissions };

export const getUserRolesAndPermissions = async (
  userId: string
): Promise<UserRolesAndPermissions> => {
  const result = await pbacDb.execute(sql`
      SELECT
        COALESCE(
          ARRAY_AGG(DISTINCT r.id) FILTER (WHERE r.id IS NOT NULL),
          '{}'
        ) AS role_ids,
        COALESCE(
          ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
          '{}'
        ) AS role_names,
        COALESCE(
          ARRAY_AGG(
            DISTINCT (
              LOWER(
                REPLACE(
                  TRIM(
                    BOTH '/' FROM
                    REGEXP_REPLACE(
                      rt.endpoint,
                      '(?<=.)/(?=.)',
                      '_',
                      'g'
                    )
                  ),
                  '-',
                  '_'
                )
              ) || '_' || LOWER(rt.method)
            )
          ) FILTER (
            WHERE rt.endpoint IS NOT NULL
              AND rt.method IS NOT NULL
          ),
          '{}'
        ) AS permissions
      FROM user_role_mappings urm
      INNER JOIN roles r ON urm.role_fk_id = r.id
      LEFT JOIN role_route_mappings rrm ON urm.role_fk_id = rrm.role_fk_id
      LEFT JOIN routes rt ON rrm.route_fk_id = rt.id AND rt.status = 1
      WHERE urm.user_fk_id = ${userId}
    `);

  const row = result.rows[0] as unknown as {
    role_ids: string[];
    role_names: string[];
    permissions: string[];
  };

  return {
    role_ids: row.role_ids || [],
    role_names: row.role_names || [],
    permissions: row.permissions || [],
  };
};
