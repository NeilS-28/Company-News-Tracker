// Authentication utilities using Node's built-in crypto module
// 0 external dependencies, fast, robust, and safe across all Node/Vercel versions.

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { db, UserRow } from '@/db';
import { hasPersistentStore, persistentUserById } from '@/lib/supabase-store';

const JWT_SECRET = process.env.AUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'marketpulse-local-development-secret');
if (!JWT_SECRET) throw new Error('AUTH_SECRET must be configured in production');
export const SESSION_COOKIE_NAME = 'marketpulse_session';

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  exp: number;
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash password with PBKDF2-HMAC-SHA512
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * Verify password against stored hash using constant-time comparison
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = hashPassword(password, salt);
    const computedBuf = Buffer.from(computed, 'hex');
    const targetBuf = Buffer.from(hash, 'hex');
    if (computedBuf.length !== targetBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, targetBuf);
  } catch {
    return false;
  }
}

/**
 * Encode buffer/string to Base64URL
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decode Base64URL to string
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Generate signed JWT token
 */
export function createSessionToken(user: { id: string; name: string; email: string }, expiresInDays = 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const payload: TokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

/**
 * Verify signed JWT token and check expiration
 */
export function verifySessionToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const expectedBuf = Buffer.from(expectedSignature);
    const signatureBuf = Buffer.from(signature);

    if (expectedBuf.length !== signatureBuf.length) return null;
    if (!crypto.timingSafeEqual(expectedBuf, signatureBuf)) return null;

    const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from Request (via Cookie or Bearer header)
 */
export async function getCurrentUser(request: NextRequest): Promise<UserRow | null> {
  // 1. Check HTTP-only cookie
  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 2. Check Authorization Bearer header
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || !payload.id) return null;

  if (hasPersistentStore) return await persistentUserById(payload.id);
  const user = db.getUserById(payload.id);
  return user || null;
}
