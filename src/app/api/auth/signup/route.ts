import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { generateSalt, hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import crypto from 'crypto';
import { hasPersistentStore, persistentUserByEmail, createPersistentUser, createPersistentWatchlist, addPersistentCompany } from '@/lib/supabase-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    // Validations
    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Check if user already exists
    const existing = hasPersistentStore ? await persistentUserByEmail(email) : db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
    }

    // Hash password & persist user
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const id = `usr_${crypto.randomUUID()}`;
    const user = hasPersistentStore
      ? await createPersistentUser({ id, name, email, passwordHash, salt })
      : db.createUser({ name, email, passwordHash, salt });

    const initialWatchlist = hasPersistentStore
      ? await createPersistentWatchlist('My Portfolio', user.id)
      : db.createWatchlist('My Portfolio', user.id);
    for (const cid of [1, 2, 3]) {
      if (hasPersistentStore) await addPersistentCompany(initialWatchlist.id, cid);
      else db.addCompanyToWatchlist(initialWatchlist.id, cid);
    }

    // Generate JWT token
    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    }, { status: 201 });

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
    const message = err instanceof Error ? err.message : 'Signup failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
