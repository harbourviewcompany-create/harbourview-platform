-- Recovery-only fail-closed hardening for additional public tables found by cutover preflight.
alter table public.jurisdiction_data_depth_tasks enable row level security;
alter table public.market_access_events enable row level security;
alter table public.market_access_proposals enable row level security;
alter table public.platform_feature_flags enable row level security;