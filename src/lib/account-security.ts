import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { hasPersistentStore, request } from '@/lib/supabase-store';

export const mailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM && hasPersistentStore);
const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export async function withinLimit(requestArg: NextRequest, action: string, identifier: string, max: number, seconds: number): Promise<boolean> {
  if (!hasPersistentStore) return process.env.NODE_ENV !== 'production';
  const ip = requestArg.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    requestArg.headers.get('x-real-ip') || 'unknown';
  const secret = process.env.AUTH_SECRET || 'local';
  const key = crypto.createHmac('sha256', secret).update(`${action}:${identifier.toLowerCase()}:${ip}`).digest('hex');
  return request<boolean>('rpc/marketpulse_check_auth_limit', { method: 'POST', body: JSON.stringify({ p_key_hash: key, p_max: max, p_window_seconds: seconds }) });
}

export async function issueMailToken(userId: string, email: string, purpose: 'verify' | 'reset'): Promise<void> {
  if (!mailConfigured) throw new Error('Email service is not configured');
  const token = crypto.randomBytes(32).toString('hex');
  await request<unknown[]>('marketpulse_auth_tokens', { method: 'POST', body: JSON.stringify({ token_hash: digest(token), user_id: userId, purpose, expires_at: new Date(Date.now() + (purpose === 'reset' ? 30 : 1440) * 60000).toISOString() }) });
  const origin = process.env.MARKETPULSE_SITE_URL || 'https://company-news-tracker.vercel.app';
  const link = `${origin.replace(/\/$/, '')}/${purpose === 'reset' ? 'reset-password' : 'verify-email'}?token=${token}`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [email], subject: purpose === 'reset' ? 'Reset your MarketPulse password' : 'Verify your MarketPulse email', text: `Open this link to ${purpose === 'reset' ? 'reset your password' : 'verify your email'}: ${link}\n\nIf you did not request this, ignore this email.` }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Mail provider rejected the request (${res.status})`);
}

export async function consumeMailToken(token: string, purpose: 'verify' | 'reset', password?: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const { generateSalt, hashPassword } = await import('@/lib/auth');
  const salt = password ? generateSalt() : null;
  return request<boolean>('rpc/marketpulse_consume_auth_token', {
    method: 'POST', body: JSON.stringify({ p_token_hash: digest(token), p_purpose: purpose, p_password_hash: password ? hashPassword(password, salt!) : null, p_salt: salt }),
  });
}
