-- Replay-safe chronological repair for the marketplace inquiry workflow.
--
-- The historical conversion migration is dated 20260304000000, but the
-- marketplace_inquiries table is not created until 20260430000000 in a clean
-- repository replay. Restore the production column and constraint contract
-- immediately after relation creation so June/July views and RPCs compile.
-- Existing production data and values are preserved.

do $marketplace_inquiry_conversion_replay$
begin
  if to_regclass('public.marketplace_inquiries') is null then
    raise exception 'public.marketplace_inquiries must exist before conversion replay';
  end if;

  alter table public.marketplace_inquiries
    add column if not exists review_status text not null default 'received',
    add column if not exists priority text not null default 'medium',
    add column if not exists last_contacted_at timestamptz,
    add column if not exists next_follow_up_at timestamptz,
    add column if not exists internal_response_notes text;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.marketplace_inquiries'::regclass
      and conname = 'marketplace_inquiries_review_status_check'
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_review_status_check
      check (review_status in (
        'received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed'
      ));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.marketplace_inquiries'::regclass
      and conname = 'marketplace_inquiries_priority_check'
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_priority_check
      check (priority in ('high', 'medium', 'low'));
  end if;
end
$marketplace_inquiry_conversion_replay$;
