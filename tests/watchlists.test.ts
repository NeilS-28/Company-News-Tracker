import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as list, POST as create } from '../src/app/api/watchlists/route';
import { GET, POST, PUT, DELETE } from '../src/app/api/watchlists/[id]/route';
import { positiveId, watchlistName } from '../src/lib/validation';

const context = { params: Promise.resolve({ id: '42' }) };
const owner = '11111111-1111-4111-8111-111111111111';
function configure() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://unit-test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key';
}
function request(method: string, body?: object) {
  return new Request('http://localhost/api/watchlists/42', {
    method,
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test('all watchlist operations reject anonymous requests', async () => {
  const req = new Request('http://localhost/api/watchlists');
  for (const handler of [GET, POST, PUT, DELETE])
    assert.equal((await handler(req, context)).status, 401);
  assert.equal((await list(req)).status, 401);
  assert.equal((await create(req)).status, 401);
});
test('IDs and names reject malformed input', () => {
  for (const id of [-1, 0, NaN, 1.1, '1x', {}, null])
    assert.throws(() => positiveId(id));
  for (const name of ['', ' ', 'x'.repeat(81), {}, null])
    assert.throws(() => watchlistName(name));
  assert.equal(watchlistName(' Banking '), 'Banking');
});
test('invalid sessions cannot reach storage', async (t) => {
  configure();
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    calls++;
    assert.match(String(input), /\/auth\/v1\/user$/);
    return Response.json({ message: 'Invalid token' }, { status: 401 });
  });
  assert.equal((await GET(request('GET'), context)).status, 401);
  assert.equal(calls, 1);
});
test('foreign or missing watchlists return 404 before any mutation', async (t) => {
  configure();
  t.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/auth/v1/user'))
        return Response.json({
          id: owner,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
          created_at: '2026-01-01T00:00:00Z',
        });
      assert.equal(init?.method ?? 'GET', 'GET');
      assert.equal(url.searchParams.get('user_id'), `eq.${owner}`);
      assert.equal(url.searchParams.get('id'), 'eq.42');
      return Response.json([]);
    },
  );
  for (const handler of [GET, POST, PUT, DELETE])
    assert.equal(
      (await handler(request('POST', { action: 'add', companyId: 1 }), context))
        .status,
      404,
    );
});
test('creation derives ownership from verified session, ignoring a supplied owner', async (t) => {
  configure();
  t.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).includes('/auth/v1/user'))
        return Response.json({
          id: owner,
          aud: 'authenticated',
          created_at: '2026-01-01T00:00:00Z',
        });
      assert.deepEqual(JSON.parse(String(init?.body)), {
        name: 'Banking',
        user_id: owner,
      });
      assert.equal(
        new Headers(init?.headers).get('authorization'),
        'Bearer test-token',
      );
      return Response.json({ id: 42, name: 'Banking' }, { status: 201 });
    },
  );
  const result = await create(
    request('POST', { name: 'Banking', user_id: 'someone-else' }),
  );
  assert.equal(result.status, 201);
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
});
