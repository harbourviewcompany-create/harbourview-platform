-- Explicit commercial outcomes for marketplace inquiries.
-- review_status remains the workflow stage; commercial_outcome is the terminal business result.

do $migration$
begin
  if to_regclass('public.marketplace_inquiries') is null then
    return;
  end if;

  alter table public.marketplace_inquiries
    add column if not exists commercial_outcome text null,
    add column if not exists commercial_outcome_reason text null,
    add column if not exists commercial_outcome_at timestamptz null;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_inquiries_commercial_outcome_check'
      and conrelid = 'public.marketplace_inquiries'::regclass
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_commercial_outcome_check
      check (
        commercial_outcome is null
        or commercial_outcome in ('won', 'lost', 'withdrawn')
      );
  end if;

  update public.marketplace_inquiries
  set
    commercial_outcome = 'won',
    commercial_outcome_reason = coalesce(commercial_outcome_reason, 'backfill:qualified'),
    commercial_outcome_at = coalesce(commercial_outcome_at, now())
  where commercial_outcome is null
    and review_status = 'qualified';

  update public.marketplace_inquiries
  set
    commercial_outcome = 'lost',
    commercial_outcome_reason = coalesce(commercial_outcome_reason, 'backfill:not_fit'),
    commercial_outcome_at = coalesce(commercial_outcome_at, now())
  where commercial_outcome is null
    and review_status = 'not_fit';
end
$migration$;
