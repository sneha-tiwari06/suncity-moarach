import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 }
    );

    // Clear authentication cookie
    return clearAuthCookie(response);
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
      },
      { status: 500 }
    );
  }
}
