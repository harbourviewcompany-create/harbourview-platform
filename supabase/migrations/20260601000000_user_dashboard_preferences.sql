begin;

-- DASH-PREF-001: User dashboard preferences for cross-device persistence.
-- Stores country + role selection so the universal dashboard restores on next visit.

create table if not exists public.user_dashboard_preferences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  country_iso2 text,
  role_id      text,
  heatmap_layer text default 'marketplace_activity',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id)
);

-- RLS
alter table public.user_dashboard_preferences enable row level security;

create policy "Users can read their own dashboard preferences"
  on public.user_dashboard_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own dashboard preferences"
  on public.user_dashboard_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own dashboard preferences"
  on public.user_dashboard_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own dashboard preferences"
  on public.user_dashboard_preferences for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_dashboard_preferences_updated_at
  before update on public.user_dashboard_preferences
  for each row execute function public.set_updated_at();

commit;
