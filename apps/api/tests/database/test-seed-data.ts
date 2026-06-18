import { getTestDatabases, testRoles, testRoutes, testRoleRouteMappings, testUsers, testUserRoleMappings } from './test-db-setup';
import { hashPassword } from '../../src/utils/auth/hashing';
import { eq } from 'drizzle-orm';

export const seedTestData = async () => {
  const { testAuthDb, testPbacDb } = getTestDatabases();

  // Seed Roles
  const adminRole = await testPbacDb!.insert(testRoles).values({
    name: 'admin',
    description: 'Administrator with full access',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  const userRole = await testPbacDb!.insert(testRoles).values({
    name: 'user',
    description: 'Regular user with limited access',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  // Seed Routes
  const loginRoute = await testPbacDb!.insert(testRoutes).values({
    endpoint: '/api/login',
    method: 'POST',
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  const healthRoute = await testPbacDb!.insert(testRoutes).values({
    endpoint: '/api/health',
    method: 'GET',
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  const userRoute = await testPbacDb!.insert(testRoutes).values({
    endpoint: '/api/users',
    method: 'GET',
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  // Seed Role-Route Mappings
  await testPbacDb!.insert(testRoleRouteMappings).values({
    roleFkId: adminRole[0]?.id!,
    routeFkId: loginRoute[0]?.id!,
    createdAt: new Date(),
  });

  await testPbacDb!.insert(testRoleRouteMappings).values({
    roleFkId: adminRole[0]?.id!,
    routeFkId: healthRoute[0]?.id!,
    createdAt: new Date(),
  });

  await testPbacDb!.insert(testRoleRouteMappings).values({
    roleFkId: adminRole[0]?.id!,
    routeFkId: userRoute[0]?.id!,
    createdAt: new Date(),
  });

  await testPbacDb!.insert(testRoleRouteMappings).values({
    roleFkId: userRole[0]?.id!,
    routeFkId: loginRoute[0]?.id!,
    createdAt: new Date(),
  });

  // Seed Test Users
  const testAdminPassword = await hashPassword('TestAdmin123!');
  const testUserPassword = await hashPassword('TestUser123!');

  const testAdmin = await testAuthDb!.insert(testUsers).values({
    firstName: 'Test',
    lastName: 'Admin',
    email: 'admin@test.com',
    password: testAdminPassword,
    loginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 1, // Active
    isDeleted: 0,
  }).returning();

  const testUser = await testAuthDb!.insert(testUsers).values({
    firstName: 'Test',
    lastName: 'User',
    email: 'user@test.com',
    password: testUserPassword,
    loginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 1, // Active
    isDeleted: 0,
  }).returning();

  // Seed User-Role Mappings
  await testPbacDb!.insert(testUserRoleMappings).values({
    userFkId: testAdmin[0]?.id!,
    roleFkId: adminRole[0]?.id!,
    createdAt: new Date(),
  });

  await testPbacDb!.insert(testUserRoleMappings).values({
    userFkId: testUser[0]?.id!,
    roleFkId: userRole[0]?.id!,
    createdAt: new Date(),
  });

  return {
    users: { admin: testAdmin[0], user: testUser[0] },
    roles: { admin: adminRole[0], user: userRole[0] },
    routes: { login: loginRoute[0], health: healthRoute[0], users: userRoute[0] },
  };
};

export const createTestUser = async (userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleNames?: string[];
}) => {
  const { testAuthDb, testPbacDb } = getTestDatabases();

  // Create user
  const hashedPassword = await hashPassword(userData.password);
  const user = await testAuthDb!.insert(testUsers).values({
    firstName: userData.firstName || 'Test',
    lastName: userData.lastName || 'User',
    email: userData.email,
    password: hashedPassword,
    loginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 1, // Active
    isDeleted: 0,
  }).returning();

  // Assign roles if provided
  if (userData.roleNames && userData.roleNames.length > 0) {
    for (const roleName of userData.roleNames) {
      // Find role by name
      const role = await testPbacDb!.select().from(testRoles).where(eq(testRoles.name, roleName)).limit(1);
      
      if (role.length > 0) {
        await testPbacDb!.insert(testUserRoleMappings).values({
          userFkId: user[0].id!,
          roleFkId: role[0].id!,
          createdAt: new Date(),
        });
      }
    }
  }

  return user[0];
};
