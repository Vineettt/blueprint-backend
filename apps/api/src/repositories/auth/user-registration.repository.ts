import { authDb, users, pbacDb, userRoleMappings, roles, emailVerificationTokens } from '@blueprint/db';
import { hashPassword } from '@utils/auth/hashing';
import { randomBytes, createHash } from 'crypto';
import { eq } from 'drizzle-orm';

const ACTIVATION_TOKEN_EXPIRY_HOURS = 24;

export const createUserWithRoleAndToken = async (
  userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  },
  roleName: string = 'basic_user'
): Promise<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: number;
  activationToken: string;
}> => {
  const hashedPassword = await hashPassword(userData.password);
  const activationToken = randomBytes(32).toString('hex');
  const activationTokenHash = createHash('sha256').update(activationToken).digest('hex');

  try {
    const userInsertResult = await authDb
      .insert(users)
      .values({
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        status: -1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
      });

    if (!userInsertResult[0]) {
      throw new Error('Failed to create user');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ACTIVATION_TOKEN_EXPIRY_HOURS);

    await authDb.insert(emailVerificationTokens).values({
      userFkId: userInsertResult[0].id,
      tokenHash: activationTokenHash,
      expiresAt,
    });

    const roleResult = await pbacDb.select().from(roles).where(eq(roles.name, roleName)).limit(1);

    if (roleResult[0]) {
      await pbacDb.insert(userRoleMappings).values({
        userFkId: userInsertResult[0].id,
        roleFkId: roleResult[0].id,
      });
    }

    return {
      id: userInsertResult[0].id,
      email: userInsertResult[0].email,
      firstName: userInsertResult[0].firstName,
      lastName: userInsertResult[0].lastName,
      status: (userInsertResult[0].status as number) ?? -1,
      activationToken,
    };
  } catch (error) {
    throw new Error(
      `User registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
