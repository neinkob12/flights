-- Fare Sniper schema. Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

create table if not exists watches (
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

create index if not exists watches_active_idx on watches (active, last_checked_at);
create index if not exists watches_email_idx on watches (lower(email));

create table if not exists alerts (
  id         bigserial primary key,
  watch_id   uuid not null references watches(id) on delete cascade,
  price      numeric(10,2) not null,
  depart_at  text,
  return_at  text,
  airline    text,
  link       text,
  channels   text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Only the server (service role) touches these tables. No public policies.
alter table watches enable row level security;
alter table alerts  enable row level security;

-- Hourly price checks. Vercel's free plan only allows daily crons, so we let
-- Supabase call the endpoint instead. Replace the two placeholders, then run:
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('fare-sniper-check', '7 * * * *', $$
--   select net.http_get(
--     url := 'https://YOUR-APP.vercel.app/api/cron/check',
--     headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
--     timeout_milliseconds := 55000
--   );
-- $$);
