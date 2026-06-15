-- ─────────────────────────────────────────────────────────────────────────────
-- 20260614100000_marketplace_seller_self_serve.sql
--
-- Extends marketplace_candidates to support authenticated supplier submissions:
--   • submitted_by   — auth user who submitted
--   • submission_source — 'self_serve' | 'intelligence' | 'admin' | 'import'
--   • submission_images — storage paths uploaded by submitter
-- Adds 5 new vision-plan category keys to the check constraint.
-- Adds RLS policies so authenticated sellers can insert and view their own rows.
-- Adds storage policies for the submissions/ prefix in marketplace-item-originals.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── 1. New columns ────────────────────────────────────────────────────────────

alter table public.marketplace_candidates
  add column if not exists submitted_by        uuid        references auth.users(id) on delete set null,
  add column if not exists submission_source   text        not null default 'intelligence',
  add column if not exists submission_images   jsonb       not null default '[]'::jsonb;

-- ── 2. Extend category_key constraint with 5 new vision categories ─────────────

alter table public.marketplace_candidates
  drop constraint if exists marketplace_candidates_category_key_check;

alter table public.marketplace_candidates
  add constraint marketplace_candidates_category_key_check
  check (
    category_key is null or category_key in (
      'consumables','packaging','new_products','used_surplus','cultivation_equipment',
      'processing_equipment','lab_testing','logistics','services','professional_services',
      'distressed_inventory','distressed_businesses','business_opportunities','export_ready',
      'import_demand','cannabis_inventory','genetics','wanted_requests','qualified_access',
      'education',
      -- vision-plan additions
      'licensing_opportunities','real_estate_facilities','technology_software',
      'investment_opportunities','research_assets'
    )
  ) not valid;

-- ── 3. Index for seller portal queries ────────────────────────────────────────

create index if not exists marketplace_candidates_submitted_by_idx
  on public.marketplace_candidates (submitted_by, discovered_at desc)
  where submitted_by is not null;

-- ── 4. RLS policies for self-serve ────────────────────────────────────────────
-- Assumes RLS is already enabled on this table from the intelligence pipeline.

drop policy if exists "Authenticated sellers can insert own candidates" on public.marketplace_candidates;
create policy "Authenticated sellers can insert own candidates"
  on public.marketplace_candidates
  for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and submission_source = 'self_serve'
  );

drop policy if exists "Authenticated sellers can view own submissions" on public.marketplace_candidates;
create policy "Authenticated sellers can view own submissions"
  on public.marketplace_candidates
  for select
  to authenticated
  using (submitted_by = auth.uid());

grant insert, select on public.marketplace_candidates to authenticated;

-- ── 5. Storage policies for submissions/ prefix ───────────────────────────────

drop policy if exists "Sellers upload submission images" on storage.objects;
create policy "Sellers upload submission images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'marketplace-item-originals'
    and (storage.foldername(name))[1] = 'submissions'
  );

drop policy if exists "Sellers read own submission images" on storage.objects;
create policy "Sellers read own submission images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'marketplace-item-originals'
    and (storage.foldername(name))[1] = 'submissions'
  );

commit;
