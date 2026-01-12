import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import User, { IUser } from '@/models/User';
import connectDB from '@/lib/mongodb';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

/**
 * Generate JWT token for a user
 */
export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
  };

  const secret = JWT_SECRET || 'default-secret-change-in-production';
  const expiresIn = JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get token from request cookie or Authorization header
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get from cookie first
  const tokenCookie = request.cookies.get('admin_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  // Try to get from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Verify authentication from request
 */
export async function verifyAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: IUser;
  error?: string;
}> {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return {
        authenticated: false,
        error: 'No authentication token provided',
      };
    }

    const payload = verifyToken(token);

    if (!payload) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
      };
    }

    await connectDB();

    // Fetch user from database
    const user = await User.findById(payload.userId).select('-password');

    if (!user) {
      return {
        authenticated: false,
        error: 'User not found',
      };
    }

    if (!user.isActive) {
      return {
        authenticated: false,
        error: 'User account is inactive',
      };
    }

    if (user.role !== 'admin') {
      return {
        authenticated: false,
        error: 'Access denied. Admin role required.',
      };
    }

    return {
      authenticated: true,
      user,
    };
  } catch (error: any) {
    console.error('Auth verification error:', error);
    return {
      authenticated: false,
      error: error.message || 'Authentication failed',
    };
  }
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete('admin_token');
  return response;
}
