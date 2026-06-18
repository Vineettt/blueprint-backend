import { authDb, users,  loginAttempts,  emailVerificationTokens,  passwordResetTokens, } from '@blueprint/db';
import { AuthProfilePayload } from '@interfaces/repositories/user.repository.interface';
import { eq, sql, inArray, and, gt, isNull } from 'drizzle-orm';
import { SearchValidator, searchSchema } from '@schemas/search.schema';

export async function fetchAuthProfileWithDbTime(
  email: string
): Promise<AuthProfilePayload | null> {
  const query = sql`
    SELECT 
      u.*,
      NOW() as "now_db"
    FROM users u
    WHERE u.email = ${email}
    LIMIT 1;
  `;

  const result = await authDb.execute(query);
  if (result.rows.length === 0) return null;

  const row = result.rows[0] as unknown as {
    id: string;
    now_db: Date;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    account_locked_until: Date | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    status: number;
  };

  return {
    user: {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      password: row.password,
      accountLockedUntil: row.account_locked_until ? new Date(row.account_locked_until) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      status: row.status
    },
    nowDb: new Date(row.now_db),
  };
}

export const getLastLoginAttempts = async (email: string, limit = 9) => {
  return await authDb
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email))
    .orderBy(sql`attempted_at DESC`)
    .limit(limit);
};

export async function logFailedAttempt(data: {
  userFkId: string;
  email: string;
  remark: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return await authDb.insert(loginAttempts).values({
    userFkId: data.userFkId,
    email: data.email,
    remark: data.remark,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
    attemptedAt: sql`NOW()`,
  });
}

export const findUserByEmail = async (email: string) => {
  const user = await authDb
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  return user[0];
};

export const findUserByToken = async (tokenHash: string) => {
  const result = await authDb
    .select({ user: users })
    .from(emailVerificationTokens)
    .innerJoin(users, eq(emailVerificationTokens.userFkId, users.id))
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.verifiedAt),
        gt(emailVerificationTokens.expiresAt, sql`NOW()`)
      )
    )
    .limit(1);

  return result.length ? result[0].user : null;
};

export const findUserDetailsByToken = async (tokenHash: string) => {
  const result = await authDb
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(emailVerificationTokens)
    .innerJoin(users, eq(emailVerificationTokens.userFkId, users.id))
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.verifiedAt),
        gt(emailVerificationTokens.expiresAt, sql`NOW()`)
      )
    )
    .limit(1);

  return result.length ? result[0] : null;
};

export const updateUserStatus = async (userId: string, status: number) => {
  await authDb.update(users).set({ status }).where(eq(users.id, userId));

  return true;
};

export const updateUser = async (
  id: string,
  updates: Partial<Omit<typeof users.$inferInsert, 'id'>>
) => {
  await authDb.update(users).set(updates).where(eq(users.id, id));
};

export const findUserByResetToken = async (tokenHash: string) => {
  const result = await authDb
    .select({ user: users, resetToken: passwordResetTokens })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userFkId, users.id))
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, sql`NOW()`)
      )
    )
    .limit(1);

  return result.length ? result[0].user : null;
};

export const createPasswordResetToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date
) => {
  await authDb.insert(passwordResetTokens).values({
    userFkId: userId,
    tokenHash,
    expiresAt,
  });

  return true;
};

export const updateUserPassword = async (email: string, password: string) => {
  await authDb.update(users).set({ password, updatedAt: new Date() }).where(eq(users.email, email));

  const userResult = await authDb
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (userResult[0]) {
    await authDb
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(eq(passwordResetTokens.userFkId, userResult[0].id), isNull(passwordResetTokens.usedAt))
      );
  }

  return true;
};

export const findPendingResetTokenByEmail = async (email: string) => {
  const result = await authDb
    .select({ token: passwordResetTokens })
    .from(users)
    .innerJoin(passwordResetTokens, eq(passwordResetTokens.userFkId, users.id))
    .where(
      and(
        eq(users.email, email),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, sql`NOW()`)
      )
    )
    .limit(1);

  return result.length ? result[0].token : null;
};

export const createEmailVerificationToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date
) => {
  await authDb.insert(emailVerificationTokens).values({
    userFkId: userId,
    tokenHash,
    expiresAt,
  });

  return true;
};

export const markEmailVerificationTokenUsed = async (tokenHash: string) => {
  await authDb
    .update(emailVerificationTokens)
    .set({ verifiedAt: new Date() })
    .where(eq(emailVerificationTokens.tokenHash, tokenHash));

  return true;
};

export const findUserById = async (id: string) => {
  const result = await authDb
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length ? result[0] : null;
};

export const findUsersByIds = async (ids: string[]) => {
  if (!ids || ids.length === 0) {
    return [];
  }

  const result = await authDb
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(inArray(users.id, ids));

  return result;
};

export const findUsersByEmailSearchWithCount = async (
  search: string,
  limit: number,
  offset: number
) => {
  const validatedSearch = SearchValidator.validateSearch(search, searchSchema);

  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
  const safeOffset = Number(offset) >= 0 ? Number(offset) : 0;

  const searchPattern = validatedSearch?.pattern || '%%';

  const whereClause = searchPattern !== '%%' ? sql`WHERE email ILIKE ${searchPattern}` : sql``;

  const [usersResult, countResult] = await Promise.all([
    authDb.execute(sql`
      SELECT
        id,
        email,
        first_name,
        last_name,
        created_at,
        status,
        CASE status
          WHEN -1 THEN 'NOT_ACTIVATED'
          WHEN 0 THEN 'ACTIVE'
          WHEN 1 THEN 'LOCKED'
          WHEN 2 THEN 'SUSPENDED'
          ELSE 'UNKNOWN'
        END AS user_status
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
      OFFSET ${safeOffset}
    `),

    authDb.execute(sql`
      SELECT COUNT(*) AS total
      FROM users
      ${whereClause}
    `),
  ]);

  return {
    users: usersResult.rows,
    total: Number(countResult.rows[0]?.total ?? 0),
  };
};
