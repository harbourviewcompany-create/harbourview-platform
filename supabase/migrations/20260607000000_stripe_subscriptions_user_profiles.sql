-- Migration: 20260607000000_stripe_subscriptions_user_profiles
-- Stripe monetization schema — user_profiles + subscriptions tables
-- Project: zvxdgdkukjrrwamdpqrg

-- 1. user_profiles: Stripe customer ID + tier per auth user
create table if not exists public.user_profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  tier               text not null default 'free' check (tier in ('free', 'intel_plus')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Service role manages profiles"
  on public.user_profiles for all
  using (auth.role() = 'service_role');

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. subscriptions: mirrors Stripe subscription state (written by webhook)
create table if not exists public.subscriptions (
  id                   text primary key,       -- Stripe subscription ID (sub_...)
  user_id              uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id   text not null,
  status               text not null,          -- active | canceled | past_due | trialing
  price_id             text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role manages subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

create index if not exists subscriptions_user_id_idx       on public.subscriptions(user_id);
create index if not exists subscriptions_customer_id_idx   on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_status_idx        on public.subscriptions(status);

-- updated_at auto-maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
