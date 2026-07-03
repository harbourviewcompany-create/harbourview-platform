-- ============================================================================
-- Wire the stale/enrichment view into the intelligence_jobs queue.
-- Idempotent: only enqueues entities without an already-open job. Safe to call
-- on a schedule (cron) to keep the queue topped up as rows go stale.
-- Priority orders by compliance liability (uncited-verified first).
-- ============================================================================
create or replace function public.enqueue_regulatory_enrichment()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_inserted integer;
begin
  insert into public.intelligence_jobs (job_type, payload, status, priority, scheduled_at)
  select
    'regulatory_format_enrichment',
    jsonb_build_object(
      'record_type', s.record_type,
      'entity_id', s.id,
      'iso_alpha2', s.iso_alpha2,
      'record_slug', s.record_slug,
      'reason', s.reason
    ),
    'pending',
    case s.reason
      when 'verified_uncited'   then 100   -- verified claim lacking a primary source: highest liability
      when 'pending_change_due' then 90    -- a scheduled change has reached its date
      when 'unverified'         then case when s.record_type='rule' then 70 else 60 end
      when 'stale'              then 50
      else 40
    end,
    now()
  from public.v_regulatory_format_stale s
  where not exists (
    select 1 from public.intelligence_jobs j
     where j.job_type = 'regulatory_format_enrichment'
       and j.status in ('pending','in_progress')
       and j.payload->>'entity_id' = s.id::text
  );
  get diagnostics v_inserted = row_count;
  return v_inserted;
end $$;

revoke all on function public.enqueue_regulatory_enrichment() from public;
grant execute on function public.enqueue_regulatory_enrichment() to service_role;

-- Seed the queue now.
select public.enqueue_regulatory_enrichment() as jobs_enqueued;