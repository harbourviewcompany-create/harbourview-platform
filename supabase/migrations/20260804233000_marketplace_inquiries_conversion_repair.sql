-- Forward repair for environments where marketplace_inquiries was created after
-- the historical conversion migration. This migration is idempotent and data-safe.
do $repair$
begin
  if to_regclass('public.marketplace_inquiries') is null then
    raise exception 'public.marketplace_inquiries must exist before conversion repair';
  end if;

  alter table public.marketplace_inquiries
    add column if not exists review_status text not null default 'received',
    add column if not exists priority text not null default 'medium',
    add column if not exists last_contacted_at timestamptz null,
    add column if not exists next_follow_up_at timestamptz null,
    add column if not exists internal_response_notes text null;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_inquiries_review_status_check'
      and conrelid = 'public.marketplace_inquiries'::regclass
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_review_status_check
      check (review_status in ('received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_inquiries_priority_check'
      and conrelid = 'public.marketplace_inquiries'::regclass
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_priority_check
      check (priority in ('high', 'medium', 'low'));
  end if;
end
$repair$;
