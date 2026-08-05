-- Production already had public.marketplace_inquiries when this historical
-- conversion ran. A clean repository replay does not create the relation until
-- 20260430000000_marketplace_inquiries.sql, after which
-- 20260430000003_marketplace_inquiries_conversion_replay.sql applies this same
-- column and constraint contract. Apply here only when the relation already
-- exists so forward-only environments preserve the original conversion while
-- zero-state replay defers it to the replay-correct migration.
do $marketplace_conversion_if_present$
begin
  if to_regclass('public.marketplace_inquiries') is null then
    raise notice 'Deferring marketplace inquiry conversion until 20260430000003';
  else
    alter table public.marketplace_inquiries
      add column if not exists review_status text not null default 'received',
      add column if not exists priority text not null default 'medium',
      add column if not exists last_contacted_at timestamptz,
      add column if not exists next_follow_up_at timestamptz,
      add column if not exists internal_response_notes text;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'marketplace_inquiries_review_status_check'
        and conrelid = 'public.marketplace_inquiries'::regclass
    ) then
      alter table public.marketplace_inquiries
        add constraint marketplace_inquiries_review_status_check
        check (review_status in ('received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed'));
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'marketplace_inquiries_priority_check'
        and conrelid = 'public.marketplace_inquiries'::regclass
    ) then
      alter table public.marketplace_inquiries
        add constraint marketplace_inquiries_priority_check
        check (priority in ('high', 'medium', 'low'));
    end if;
  end if;
end
$marketplace_conversion_if_present$;
