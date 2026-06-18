import { pbacDb } from '@blueprint/db';
import { sql } from 'drizzle-orm';
import type { RouteWithRoles } from '@interfaces/repositories/pbac.repository.interface';

export const findRouteWithRoles = async (
  endpoint: string,
  method: string
): Promise<RouteWithRoles[]> => {
  const dbPath = endpoint?.replace('/api', '') || endpoint;

  const result = await pbacDb.execute(sql`
    SELECT 
      routes.id,
      routes.endpoint,
      routes.method,
      routes.status,
      COALESCE(
        ARRAY_AGG(role_route_mappings.role_fk_id)
          FILTER (WHERE role_route_mappings.role_fk_id IS NOT NULL),
          '{}'
        ) AS role_fk_ids
    FROM routes
    LEFT JOIN role_route_mappings 
      ON role_route_mappings.route_fk_id = routes.id
    WHERE routes.endpoint = ${dbPath} AND routes.method = ${method.toLowerCase()}
    GROUP BY 
      routes.id,
      routes.endpoint,
      routes.method,
      routes.status;
  `);

  return result.rows as unknown as RouteWithRoles[];
};
