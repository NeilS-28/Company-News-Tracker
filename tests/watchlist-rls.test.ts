import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Execute the real migration and policies. Only Supabase's auth.uid() is emulated.
test('PostgreSQL enforces private watchlists even when API checks are bypassed', async (t) => {
  const database = new PGlite();
  t.after(() => database.close());
  const alice = '11111111-1111-4111-8111-111111111111';
  const bob = '22222222-2222-4222-8222-222222222222';
  await database.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  await database.query('insert into auth.users(id) values ($1), ($2)', [
    alice,
    bob,
  ]);
  await database.exec(
    readFileSync(
      new URL(
        '../supabase/migrations/202609190001_private_watchlists.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  async function asUser(id: string) {
    await database.exec('reset role; set role authenticated;');
    await database.query(
      "select set_config('request.jwt.claim.sub', $1, false)",
      [id],
    );
  }
  await asUser(alice);
  const created = await database.query<{ id: number }>(
    'insert into public.watchlists(name) values ($1) returning id',
    ['Alice list'],
  );
  const listId = created.rows[0].id;
  await database.query(
    'insert into public.watchlist_companies(watchlist_id, company_id) values ($1, 1)',
    [listId],
  );
  assert.equal(
    (await database.query('select * from public.watchlists')).rows.length,
    1,
  );

  await t.test(
    'another account cannot read, rename, delete, or add members to the list',
    async () => {
      await asUser(bob);
      assert.equal(
        (await database.query('select * from public.watchlists')).rows.length,
        0,
      );
      assert.equal(
        (await database.query('select * from public.watchlist_companies')).rows
          .length,
        0,
      );
      assert.equal(
        (
          await database.query(
            'update public.watchlists set name = $1 where id = $2 returning id',
            ['Changed', listId],
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await database.query(
            'delete from public.watchlists where id = $1 returning id',
            [listId],
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await database.query(
            'delete from public.watchlist_companies where watchlist_id = $1 returning company_id',
            [listId],
          )
        ).rows.length,
        0,
      );
      await assert.rejects(
        database.query(
          'insert into public.watchlist_companies(watchlist_id, company_id) values ($1, 2)',
          [listId],
        ),
        /row-level security/,
      );
      await assert.rejects(
        database.query(
          'insert into public.watchlists(user_id, name) values ($1, $2)',
          [alice, 'Spoofed owner'],
        ),
        /row-level security/,
      );
    },
  );
  await t.test('anonymous database access is denied', async () => {
    await database.exec('reset role; set role anon;');
    await assert.rejects(
      database.query('select * from public.watchlists'),
      /permission denied/,
    );
    await assert.rejects(
      database.query('select * from public.watchlist_companies'),
      /permission denied/,
    );
  });
  await t.test(
    'owner changes persist, duplicates are safe, and limits are enforced',
    async () => {
      await asUser(alice);
      await database.query(
        'update public.watchlists set name = $1 where id = $2',
        ['Renamed', listId],
      );
      await database.query(
        'insert into public.watchlist_companies(watchlist_id, company_id) values ($1, 1) on conflict do nothing',
        [listId],
      );
      assert.equal(
        (await database.query('select * from public.watchlist_companies')).rows
          .length,
        1,
      );
      await database.query(
        'insert into public.watchlist_companies(watchlist_id, company_id) select $1, generate_series(2,100)',
        [listId],
      );
      await assert.rejects(
        database.query(
          'insert into public.watchlist_companies(watchlist_id, company_id) values ($1,101)',
          [listId],
        ),
        /maximum of 100/,
      );
      await database.query(
        "insert into public.watchlists(name) select 'List ' || generate_series(2,20)",
      );
      await assert.rejects(
        database.query(
          "insert into public.watchlists(name) values ('Too many')",
        ),
        /maximum of 20/,
      );
      await asUser(bob);
      await asUser(alice);
      assert.equal(
        (
          await database.query<{ name: string }>(
            'select name from public.watchlists where id = $1',
            [listId],
          )
        ).rows[0].name,
        'Renamed',
      );
      await database.query('delete from public.watchlists where id = $1', [
        listId,
      ]);
      assert.equal(
        (
          await database.query(
            'select * from public.watchlist_companies where watchlist_id = $1',
            [listId],
          )
        ).rows.length,
        0,
      );
    },
  );
});
