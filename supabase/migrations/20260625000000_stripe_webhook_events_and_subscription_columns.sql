-- Migration: 20260625000000_stripe_webhook_events_and_subscription_columns
-- 1. Adds columns the Stripe webhook already writes (tier, canceled_at) so
--    subscription upserts no longer fail at runtime.
-- 2. Adds a processed-events table to make webhook handling idempotent against
--    Stripe event replays / retries.
-- Run on Supabase project: zvxdgdkukjrrwamdpqrg

-- 1. Backfill missing columns on subscriptions ------------------------------
alter table public.subscriptions
  add column if not exists tier text;

alter table public.subscriptions
  add column if not exists canceled_at timestamptz;

-- 2. Idempotency ledger for Stripe webhook events ---------------------------
create table if not exists public.stripe_webhook_events (
  id           text primary key,        -- Stripe event id (evt_...)
  type         text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

-- Service role only; never exposed to clients.
drop policy if exists "Service role manages webhook events" on public.stripe_webhook_events;
create policy "Service role manages webhook events"
  on public.stripe_webhook_events for all
  using (auth.role() = 'service_role');
