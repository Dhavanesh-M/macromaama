-- Legacy Macromaama demo schema. The current app persists data in this
-- browser and does not send profile or nutrition records to Supabase.
-- These tables have RLS enabled with no anonymous policies: client access is
-- intentionally denied until authenticated ownership policies are implemented.
create extension if not exists pgcrypto;

create table if not exists profiles (
  id text primary key,
  weight real,
  height real,
  age int,
  gender text,
  activity text,
  goal text,
  updated_at timestamptz
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  profile_id text,
  date date,
  meals jsonb,
  total_calories real,
  total_protein real,
  total_fat real,
  total_carbs real,
  created_at timestamptz default now()
);

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id text,
  date date,
  food_name text,
  grams real,
  calories real,
  protein real,
  fat real,
  carbs real,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table plans enable row level security;
alter table food_logs enable row level security;
