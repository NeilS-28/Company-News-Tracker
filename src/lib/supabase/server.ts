import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/validation';

export async function requireUser(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim())
    throw new ApiError(401, 'Please sign in to use watchlists.');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new ApiError(
      503,
      'Watchlists are not available yet. Please try again later.',
    );
  // Each request has its own client. Never use a service-role key or cache a user's session.
  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: authorization },
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        }),
    },
  });
  const { data, error } = await client.auth.getUser(authorization.slice(7));
  if (error || !data.user)
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  return { client, user: data.user };
}
