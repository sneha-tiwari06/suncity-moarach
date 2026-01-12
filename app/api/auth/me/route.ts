import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Not authenticated',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authResult.user._id.toString(),
          username: authResult.user.username,
          email: authResult.user.email,
          role: authResult.user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication check failed',
      },
      { status: 500 }
    );
  }
}
