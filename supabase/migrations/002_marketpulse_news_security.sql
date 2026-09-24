-- Run once in Supabase SQL Editor. Server routes alone use these tables/RPC.
create table if not exists public.marketpulse_news_archive (
  id text primary key,
  source_type text not null check (source_type in ('news', 'nse-filing')),
  published_at timestamptz not null,
  article jsonb not null,
  ingested_at timestamptz not null default now()
);
create index if not exists marketpulse_news_archive_recent_idx on public.marketpulse_news_archive(published_at desc);
create table if not exists public.marketpulse_provider_health (
  provider text primary key,
  checked_at timestamptz not null,
  last_success_at timestamptz,
  status text not null check (status in ('ok', 'error')),
  item_count integer not null default 0
);
-- The database checks and increments attempts atomically across Vercel instances.
create table if not exists public.marketpulse_auth_attempts (
  key_hash text primary key,
  attempts integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.marketpulse_users add column if not exists email_verified_at timestamptz default now();
alter table public.marketpulse_users add column if not exists session_version integer not null default 0;
create table if not exists public.marketpulse_auth_tokens (
  token_hash text primary key,
  user_id text not null references public.marketpulse_users(id) on delete cascade,
  purpose text not null check (purpose in ('verify', 'reset')),
  expires_at timestamptz not null
);
create index if not exists marketpulse_auth_tokens_expiry_idx on public.marketpulse_auth_tokens(expires_at);
create or replace function public.marketpulse_consume_auth_token(p_token_hash text, p_purpose text, p_password_hash text default null, p_salt text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare t public.marketpulse_auth_tokens%rowtype;
begin
  select * into t from public.marketpulse_auth_tokens
    where token_hash = p_token_hash and purpose = p_purpose and expires_at > now() for update;
  if not found then return false; end if;
  if p_purpose = 'reset' then
    if p_password_hash is null or p_salt is null then return false; end if;
    update public.marketpulse_users set password_hash = p_password_hash, salt = p_salt,
      session_version = session_version + 1 where id = t.user_id;
  elsif p_purpose = 'verify' then
    update public.marketpulse_users set email_verified_at = now() where id = t.user_id;
  else return false; end if;
  delete from public.marketpulse_auth_tokens where user_id = t.user_id and purpose = p_purpose;
  return true;
end $$;
create or replace function public.marketpulse_check_auth_limit(p_key_hash text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.marketpulse_auth_attempts(key_hash, attempts, window_start)
    values (p_key_hash, 1, now())
    on conflict (key_hash) do update
      set attempts = case when marketpulse_auth_attempts.window_start < now() - make_interval(secs => p_window_seconds)
                          then 1 else marketpulse_auth_attempts.attempts + 1 end,
          window_start = case when marketpulse_auth_attempts.window_start < now() - make_interval(secs => p_window_seconds)
                              then now() else marketpulse_auth_attempts.window_start end
    returning attempts into n;
  return n <= p_max;
end $$;
revoke all on function public.marketpulse_check_auth_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.marketpulse_consume_auth_token(text, text, text, text) from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.marketpulse_news_archive, public.marketpulse_provider_health, public.marketpulse_auth_attempts, public.marketpulse_auth_tokens to service_role;
grant execute on function public.marketpulse_check_auth_limit(text, integer, integer) to service_role;
grant execute on function public.marketpulse_consume_auth_token(text, text, text, text) to service_role;
alter table public.marketpulse_news_archive enable row level security;
alter table public.marketpulse_provider_health enable row level security;
alter table public.marketpulse_auth_attempts enable row level security;
alter table public.marketpulse_auth_tokens enable row level security;
