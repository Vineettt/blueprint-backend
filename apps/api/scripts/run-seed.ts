import { sql } from 'drizzle-orm';
import { roles, roleRouteMappings, routes, pbacDb } from '@blueprint/db';
import { logger } from '@blueprint/logger';

export async function seedRoles() {
  try {
    const result = await pbacDb.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'roles'
      );
    `);

    const tableExists = result.rows[0]?.exists;

    if (!tableExists) {
      logger.warn('Roles table does not exist. Skipping seed.');
      return;
    }

    await pbacDb
      .insert(roles)
      .values({
        name: 'basic_user',
        description: 'Basic user role with standard permissions',
      })
      .onConflictDoNothing();

    const basicUserRole = await pbacDb.query.roles.findFirst({
      where: (roles, { eq }) => eq(roles.name, 'basic_user'),
    });

    if (!basicUserRole) {
      return;
    }
  } catch {}
}

seedRoles()
  .then(() => {
    console.log('Seed finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });