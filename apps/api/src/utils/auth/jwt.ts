import jwt from 'jsonwebtoken';

export const generateJwt = async (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: number
): Promise<string> => {
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch {
    throw new Error('JWT generation failed');
  }
};

export const verifyJwt = async (token: string, secret: string): Promise<unknown> => {
  return jwt.verify(token, secret);
};
