import { it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/cron/ingest/route';

it('rejects scheduled ingestion without the shared secret', async () => {
  const prior = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test-cron-secret';
  try {
    const absent = await GET(new NextRequest('https://example.com/api/cron/ingest'));
    const incorrect = await GET(new NextRequest('https://example.com/api/cron/ingest', { headers: { authorization: 'Bearer wrong-secret' } }));
    assert.equal(absent.status, 401);
    assert.equal(incorrect.status, 401);
  } finally {
    if (prior === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prior;
  }
});
