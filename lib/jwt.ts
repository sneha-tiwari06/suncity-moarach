import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

/**
 * Generate JWT token for a user
 * This function is safe to use in Edge Runtime (no mongoose dependencies)
 */
export function generateToken(payload: JWTPayload): string {
  const secret = JWT_SECRET || 'default-secret-change-in-production';
  const expiresIn = JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 * This function is safe to use in Edge Runtime (no mongoose dependencies)
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

