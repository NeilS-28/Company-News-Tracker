import { NextRequest, NextResponse } from 'next/server';
import { persistentUserByEmail } from '@/lib/supabase-store';
import { mailConfigured, withinLimit, issueMailToken } from '@/lib/account-security';

export async function POST(request: NextRequest) {
  if (!mailConfigured) return NextResponse.json({ success: false, error: 'Email recovery is not configured yet.' }, { status: 503 });
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const purpose = body.purpose === 'verify' ? 'verify' : 'reset';
  if (!email || email.length > 254) return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
  const generic = { success: true, message: 'If the address is eligible, a link is on its way.' };
  try {
    // Limit both the address and the calling IP, including unknown accounts.
    const allowed = await withinLimit(request, `mail-${purpose}`, email, 3, 60 * 60);
    const ipAllowed = await withinLimit(request, 'mail-ip', 'all', 12, 60 * 60);
    if (allowed && ipAllowed) {
      const user = await persistentUserByEmail(email);
      if (user && (purpose === 'reset' || !user.emailVerifiedAt)) {
        await issueMailToken(user.id, email, purpose);
      }
    }
    return NextResponse.json(generic);
  } catch (error) {
    console.error('Email request failed', error);
    return NextResponse.json(generic);
  }
}
