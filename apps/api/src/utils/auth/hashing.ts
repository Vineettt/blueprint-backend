import argon2 from 'argon2';

export const hashCompare = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await argon2.verify(hashedPassword, password);
  } catch {
    throw new Error('Password comparison failed');
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
  } catch {
    throw new Error('Password hashing failed');
  }
};
