'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const client = getBrowserClient();
  if (!client)
    throw new Error(
      'Watchlists are not available yet. Please try again later.',
    );
  const { data, error } = await client.auth.getSession();
  if (error || !data.session)
    throw new Error('Please sign in to use watchlists.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...init, headers, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok || !body.success)
    throw new Error(body.error || 'The request failed. Please retry.');
  return body.data;
}
