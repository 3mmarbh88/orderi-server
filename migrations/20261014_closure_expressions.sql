-- Orderi closure expression sync migration
-- Run this once in the Supabase SQL Editor for project mczxrgjuelqjmxbtzbxj.

create table if not exists public.closure_expressions (
  id uuid primary key default gen_random_uuid(),
  captain_phone text not null,
  phrase text not null check (char_length(phrase) between 1 and 80),
  category text not null check (category in ('taken', 'completion', 'gratitude', 'emoji')),
  meaning text not null default '',
  confidence integer not null default 90 check (confidence between 0 and 100),
  learned_at timestamptz not null default now(),
  is_ai_learned boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (captain_phone, phrase)
);

create index if not exists closure_expressions_captain_idx
  on public.closure_expressions(captain_phone, updated_at desc);

alter table public.closure_expressions enable row level security;
-- The Node server uses SUPABASE_SERVICE_ROLE_KEY. Do not add broad anon policies.
