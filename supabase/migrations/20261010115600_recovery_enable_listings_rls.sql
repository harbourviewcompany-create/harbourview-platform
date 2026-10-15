-- Recovery-only security correction. listings already has a SELECT policy,
-- but RLS was disabled in the reconstructed database.
alter table public.listings enable row level security;