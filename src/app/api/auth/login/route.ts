import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { hasPersistentStore, persistentUserByEmail } from '@/lib/supabase-store';
import { withinLimit, mailConfigured } from '@/lib/account-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }
    if (!(await withinLimit(request, 'login', email, 8, 15 * 60)) ||
        !(await withinLimit(request, 'login-ip', 'all', 40, 15 * 60))) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const user = hasPersistentStore ? await persistentUserByEmail(email) : db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
    }
    if (mailConfigured && !user.emailVerifiedAt) {
      return NextResponse.json({ success: false, error: 'Verify your email before signing in. Check your inbox.' }, { status: 403 });
    }

    // Generate JWT token
    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      sessionVersion: user.sessionVersion,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
