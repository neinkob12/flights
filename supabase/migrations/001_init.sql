-- Fare Sniper schema. Everything is prefixed fs_ so it can live safely inside
-- a shared Supabase project. Access goes through the public (anon/publishable)
-- key PLUS a secret header (x-fs-secret) checked by row level security, so no
-- service-role key is needed.

create extension if not exists pgcrypto;

create schema if not exists fs_private;
revoke all on schema fs_private from public, anon, authenticated;

create table if not exists fs_private.config (
  id     int primary key default 1 check (id = 1),
  secret text not null
);
-- After running this file once:
--   insert into fs_private.config (secret) values ('<FS_DB_SECRET>')
--   on conflict (id) do update set secret = excluded.secret;

create or replace function public.fs_authorized() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (current_setting('request.headers', true)::json ->> 'x-fs-secret')
      = (select secret from fs_private.config where id = 1),
    false)
$$;

create table if not exists public.fs_watches (
  id               uuid primary key default gen_random_uuid(),
  manage_token     text not null default encode(gen_random_bytes(18), 'hex'),
  origin           text not null check (origin ~ '^[A-Z]{3}$'),
  destination      text not null check (destination ~ '^[A-Z]{3}$'),
  depart_from      date not null,
  depart_to        date not null,
  trip_type        text not null default 'return' check (trip_type in ('one_way','return')),
  nights_min       int  check (nights_min between 1 and 60),
  nights_max       int  check (nights_max between 1 and 60),
  direct_only      boolean not null default false,
  max_price        numeric(10,2) not null check (max_price > 0),
  currency         text not null default 'eur',
  email            text,
  email_confirmed  boolean not null default false,
  telegram_chat_id bigint,
  active           boolean not null default true,
  last_checked_at  timestamptz,
  last_price       numeric(10,2),
  last_alert_price numeric(10,2),
  last_alert_at    timestamptz,
  created_at       timestamptz not null default now(),
  check (depart_to >= depart_from)
);
create index if not exists fs_watches_active_idx on public.fs_watches (active, last_checked_at);
create index if not exists fs_watches_email_idx on public.fs_watches (email);
create index if not exists fs_watches_chat_idx on public.fs_watches (telegram_chat_id);

create table if not exists public.fs_alerts (
  id         bigserial primary key,
  watch_id   uuid not null references public.fs_watches(id) on delete cascade,
  price      numeric(10,2) not null,
  depart_at  text,
  return_at  text,
  airline    text,
  link       text,
  channels   text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists fs_alerts_watch_idx on public.fs_alerts (watch_id);

alter table public.fs_watches enable row level security;
alter table public.fs_alerts  enable row level security;

drop policy if exists fs_watches_app on public.fs_watches;
create policy fs_watches_app on public.fs_watches for all to anon, authenticated
  using ((select public.fs_authorized())) with check ((select public.fs_authorized()));

drop policy if exists fs_alerts_app on public.fs_alerts;
create policy fs_alerts_app on public.fs_alerts for all to anon, authenticated
  using ((select public.fs_authorized())) with check ((select public.fs_authorized()));

-- Hourly price checks (Vercel's free plan only allows daily crons):
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('fare-sniper-check', '7 * * * *', $$
--   select net.http_get(
--     url := 'https://YOUR-APP.vercel.app/api/cron/check',
--     headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
--     timeout_milliseconds := 55000
--   );
-- $$);
