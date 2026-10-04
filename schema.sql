-- ORDERI / SUPABASE DATABASE
-- Project: mczxrgjuelqjmxbtzbxj
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.captains (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null,
  password_hash text,
  vehicle_type text not null default 'car',
  is_activated boolean not null default false,
  activation_code text,
  license_plan text default 'بانتظار كود التفعيل',
  activated_at timestamptz,
  expires_at timestamptz,
  biometrics_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan_name text not null,
  duration_days integer not null default 30,
  is_vip boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  used_by uuid references public.captains(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.captain_settings (
  captain_id uuid primary key references public.captains(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  captain_id uuid references public.captains(id) on delete set null,
  from_area text not null default 'البحرين',
  to_area text not null default 'البحرين',
  price numeric(10,3) not null default 0,
  raw_text text not null,
  group_name text,
  sender_name text,
  sender_phone text,
  received_at timestamptz not null default now(),
  confidence integer default 0,
  type text,
  notes text,
  status text not null default 'pending',
  source text,
  is_direct_private boolean not null default false,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists orders_received_at_idx on public.orders(received_at desc);
create index if not exists orders_captain_idx on public.orders(captain_id);

create table if not exists public.discovered_group_links (
  id text primary key,
  invite_code text not null unique,
  url text not null,
  title text,
  sender_name text,
  sender_phone text,
  source_group text,
  raw_text text,
  captured_at timestamptz not null default now(),
  status text not null default 'new',
  is_monitored boolean not null default false
);

create table if not exists public.whatsapp_sessions (
  id text primary key default 'default',
  status text not null default 'disconnected',
  qr_code_data_url text,
  pairing_code text,
  connected_phone text,
  connected_at timestamptz,
  device_name text default 'Orderi Radar Gateway',
  battery_level integer default 100,
  groups_monitored_count integer default 0,
  private_chats_monitored_count integer default 0,
  total_orders_captured integer not null default 0,
  last_sync_at timestamptz,
  listener_service_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.broadcasts (
  id text primary key,
  captain_id uuid references public.captains(id) on delete set null,
  reply_text text,
  target_groups jsonb not null default '[]'::jsonb,
  original_text text,
  sent_at timestamptz not null default now()
);

create table if not exists public.server_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists captains_updated_at on public.captains;
create trigger captains_updated_at before update on public.captains
for each row execute function public.set_updated_at();

-- RLS: the Node server uses the secret key and therefore bypasses these policies.
alter table public.captains enable row level security;
alter table public.activation_codes enable row level security;
alter table public.captain_settings enable row level security;
alter table public.orders enable row level security;
alter table public.discovered_group_links enable row level security;
alter table public.whatsapp_sessions enable row level security;
alter table public.broadcasts enable row level security;
alter table public.server_events enable row level security;

-- Do not create broad anon policies. The server is the controlled backend.
