-- Migration: 20260607000000_stripe_subscriptions_user_profiles
-- Stripe monetization schema — user_profiles + subscriptions tables
-- Run on Supabase project: zvxdgdkukjrrwamdpqrg

-- 1. user_profiles
create table if not exists public.user_profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  stripe_customer_id text unique,
  tier               text not null default 'free' check (tier in ('free', 'intel', 'operator')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Service role manages profiles" on public.user_profiles;
create policy "Service role manages profiles"
  on public.user_profiles for all
  using (auth.role() = 'service_role');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. subscriptions
create table if not exists public.subscriptions (
  id                   text primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id   text not null,
  status               text not null,
  price_id             text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages subscriptions" on public.subscriptions;
create policy "Service role manages subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

create index if not exists subscriptions_user_id_idx     on public.subscriptions(user_id);
create index if not exists subscriptions_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_status_idx      on public.subscriptions(status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
