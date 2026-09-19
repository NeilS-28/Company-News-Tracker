-- Run once in the Supabase SQL editor or with the Supabase migration CLI.
begin;
create table public.watchlists (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index watchlists_owner_idx on public.watchlists(user_id);
create table public.watchlist_companies (
  watchlist_id bigint not null references public.watchlists(id) on delete cascade,
  company_id integer not null check (company_id > 0),
  created_at timestamptz not null default now(),
  primary key (watchlist_id, company_id)
);
alter table public.watchlists enable row level security;
alter table public.watchlist_companies enable row level security;
create policy watchlists_owner on public.watchlists for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy watchlist_companies_owner on public.watchlist_companies for all to authenticated
  using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));
revoke all on public.watchlists, public.watchlist_companies from anon;
grant select, insert, update, delete on public.watchlists to authenticated;
grant select, insert, delete on public.watchlist_companies to authenticated;
grant usage, select on sequence public.watchlists_id_seq to authenticated;
create function public.touch_watchlist() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger watchlist_updated before update on public.watchlists for each row execute function public.touch_watchlist();
-- Bound per-account storage and the API's upstream fan-out, including direct REST access.
create function public.limit_watchlists() returns trigger language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if (select count(*) from public.watchlists where user_id = new.user_id) >= 20 then
    raise exception 'A maximum of 20 watchlists is supported.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger watchlist_limit before insert on public.watchlists for each row execute function public.limit_watchlists();
create function public.limit_watchlist_companies() returns trigger language plpgsql set search_path = '' as $$
begin
  perform 1 from public.watchlists where id = new.watchlist_id for update;
  if not exists (select 1 from public.watchlist_companies where watchlist_id = new.watchlist_id and company_id = new.company_id)
     and (select count(*) from public.watchlist_companies where watchlist_id = new.watchlist_id) >= 100 then
    raise exception 'A maximum of 100 companies per watchlist is supported.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger watchlist_company_limit before insert on public.watchlist_companies for each row execute function public.limit_watchlist_companies();
create function public.touch_watchlist_membership() returns trigger language plpgsql set search_path = '' as $$
begin
  update public.watchlists set updated_at = now() where id = coalesce(new.watchlist_id, old.watchlist_id);
  return null;
end;
$$;
create trigger watchlist_membership_updated after insert or delete on public.watchlist_companies for each row execute function public.touch_watchlist_membership();
commit;
