import { NextRequest, NextResponse } from 'next/server';
import { consumeMailToken, withinLimit } from '@/lib/account-security';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = typeof body.token === 'string' ? body.token : '';
  const purpose = body.purpose === 'verify' ? 'verify' : 'reset';
  const password = body.password;
  if (purpose === 'reset' && (typeof password !== 'string' || password.length < 10 || password.length > 256)) {
    return NextResponse.json({ success: false, error: 'Use a password of 10 to 256 characters.' }, { status: 400 });
  }
  try {
    if (!(await withinLimit(request, `confirm-${purpose}`, 'all', 30, 60 * 60))) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    const ok = await consumeMailToken(token, purpose, purpose === 'reset' ? password : undefined);
    return NextResponse.json(ok ? { success: true } : { success: false, error: 'This link has expired or was already used.' }, { status: ok ? 200 : 400 });
  } catch (error) {
    console.error('Token confirmation failed', error);
    return NextResponse.json({ success: false, error: 'Please try again later.' }, { status: 503 });
  }
}
