-- Baseline capture: pipeline_tasks / dead_letter_tasks task-queue tables and
-- claim_pipeline_tasks / complete_pipeline_task / fail_pipeline_task, plus
-- bulk_load_sources, hv_audit_publication, hv_requeue_failed_embed_jobs, and
-- hv_trigger_embed/extract/score -- 9 functions and 2 tables, none with a
-- real creator anywhere in this repository. Found via the same full
-- public/api function audit that turned up 48 untracked-origin objects
-- (see docs/control/EVIDENCE_LOG.md).
--
-- Some ledger history exists for a few of these (20260618144144,
-- 20260629015325, 20260701111452, 20260701191146, 20260701191208,
-- 20260720200000), but it's scattered ALTERs and header-format iterations
-- across six migrations rather than one clean creator -- notably
-- fix_cron_trigger_auth_headers and its _v2 both touch hv_trigger_extract/
-- score's headers. Reassembling that chain risks landing on an
-- intermediate, superseded state. Captured the converged live definitions
-- directly instead (verbatim pg_get_functiondef / information_schema),
-- same approach as the auth-verifier baseline capture in this session.
--
-- pipeline_tasks/dead_letter_tasks: verified RLS is enabled with only a
-- service-role-all policy on each (pg_policies), confirmed before writing,
-- not assumed -- matches the pattern every other task-queue table in this
-- repo uses.

CREATE TYPE public.queue_status AS ENUM ('queued', 'claimed', 'done', 'failed', 'dead');

CREATE TABLE public.pipeline_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_name text NOT NULL,
  task_type text NOT NULL,
  payload jsonb NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  status public.queue_status NOT NULL DEFAULT 'queued'::public.queue_status,
  available_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  claimed_by text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  last_error text,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (queue_name, idempotency_key)
);

CREATE INDEX pipeline_tasks_claim_idx ON public.pipeline_tasks
  USING btree (queue_name, status, available_at, priority DESC, created_at);

ALTER TABLE public.pipeline_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role all pipeline_tasks" ON public.pipeline_tasks
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.dead_letter_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_task_id uuid,
  queue_name text NOT NULL,
  task_type text NOT NULL,
  payload jsonb NOT NULL,
  failure_reason text,
  attempts integer NOT NULL,
  moved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dead_letter_tasks_original_task ON public.dead_letter_tasks
  USING btree (original_task_id);

ALTER TABLE public.dead_letter_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role all dead_letter_tasks" ON public.dead_letter_tasks
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.claim_pipeline_tasks(p_queue_name text, p_worker_name text, p_limit integer DEFAULT 10)
 RETURNS SETOF pipeline_tasks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  return query
  with claimed as (
    update public.pipeline_tasks
       set status = 'claimed',
           claimed_at = now(),
           claimed_by = p_worker_name,
           attempts = attempts + 1
     where id in (
       select id
         from public.pipeline_tasks
        where queue_name = p_queue_name
          and status = 'queued'
          and available_at <= now()
        order by priority desc, created_at
        limit p_limit
        for update skip locked
     )
     returning *
  )
  select * from claimed;
end;
$function$;

CREATE OR REPLACE FUNCTION public.complete_pipeline_task(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  update public.pipeline_tasks
     set status = 'done',
         finished_at = now()
   where id = p_task_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fail_pipeline_task(p_task_id uuid, p_error text, p_retry_delay_seconds integer DEFAULT 300)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_task public.pipeline_tasks;
begin
  select * into v_task from public.pipeline_tasks where id = p_task_id;

  if not found then
    return;
  end if;

  if v_task.attempts >= v_task.max_attempts then
    update public.pipeline_tasks
       set status = 'dead',
           last_error = p_error
     where id = p_task_id;

    insert into public.dead_letter_tasks (
      original_task_id,
      queue_name,
      task_type,
      payload,
      failure_reason,
      attempts
    )
    values (
      v_task.id,
      v_task.queue_name,
      v_task.task_type,
      v_task.payload,
      p_error,
      v_task.attempts
    );
  else
    update public.pipeline_tasks
       set status = 'queued',
           claimed_at = null,
           claimed_by = null,
           available_at = now() + make_interval(secs => p_retry_delay_seconds),
           last_error = p_error
     where id = p_task_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_load_sources(p_sources jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE
  v_source jsonb;
  v_count  integer := 0;
  v_adapter text;
  v_tier    integer;
BEGIN
  FOR v_source IN SELECT value FROM jsonb_array_elements(p_sources)
  LOOP
    v_adapter := CASE lower(v_source->>'type')
      WHEN 'rss' THEN 'rss'
      WHEN 'api' THEN 'api'
      ELSE 'html_snapshot'
    END;

    BEGIN
      v_tier := (v_source->>'tier')::integer;
    EXCEPTION WHEN OTHERS THEN
      v_tier := 2;
    END;

    INSERT INTO public.source_registry (
      source_name, source_url, source_type, jurisdiction,
      country, subcategory, language, tier,
      adapter, crawl_cadence, relevance_status,
      fetch_method, is_active, notes
    ) VALUES (
      v_source->>'name',
      v_source->>'url',
      COALESCE(lower(v_source->>'type'), 'html'),
      v_source->>'country',
      v_source->>'country',
      v_source->>'subcategory',
      'en',
      v_tier,
      v_adapter,
      'daily',
      'active',
      'manual_url',
      true,
      v_source->>'notes'
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.hv_audit_publication()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_events (entity_type, entity_id, action, actor, metadata)
    VALUES (
      'hv_public_feed',
      NEW.id,
      'publication.' || NEW.status,
      coalesce(NEW.approved_by::text, 'system'),
      jsonb_build_object(
        'artifact_id', NEW.artifact_id,
        'feed_type', NEW.feed_type,
        'previous_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.hv_requeue_failed_embed_jobs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
DECLARE v_count INTEGER;
BEGIN
  UPDATE hv_processing_jobs
  SET status         = 'pending',
      last_error     = NULL,
      next_retry_at  = NULL,
      updated_at     = now()
  WHERE job_type     = 'embed'
    AND status       = 'failed'
    AND attempt_count < max_attempts;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- hv_trigger_embed/extract/score: cron-invoked HTTP dispatchers to this
-- project's own edge functions. Note the hardcoded bearer token below is
-- this project's ANON key (decode it: role=anon), not a secret credential
-- -- it's the same key already shipped in every client-side request the
-- Command Centre app makes, and is meant to be public. Restored verbatim
-- rather than "improved" to a dynamic lookup, since this is a restoration
-- of the exact live contract, not a redesign; worth someone deciding later
-- whether to move it to a vault-backed reference for consistency with
-- hv_trigger_extract's own x-harbourview-cron-caller header two lines
-- below, which already does that correctly.
CREATE OR REPLACE FUNCTION public.hv_trigger_embed()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  SELECT net.http_post(
    url     := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-embed-worker',
    headers := jsonb_build_object(
      'Content-Type',              'application/json',
      'Authorization',             'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M',
      'x-harbourview-cron-caller', 'pg_cron_hv_embed'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$function$;

CREATE OR REPLACE FUNCTION public.hv_trigger_extract()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  SELECT net.http_post(
    url     := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-extract',
    params  := jsonb_build_object('limit','10'),
    headers := jsonb_build_object(
      'Content-Type',              'application/json',
      'Authorization',             'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M',
      'x-harbourview-cron-caller', (select decrypted_secret from vault.decrypted_secrets where name = 'hv_pipeline_cron_shared_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$function$;

CREATE OR REPLACE FUNCTION public.hv_trigger_score()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
  SELECT net.http_post(
    url     := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-score',
    params  := jsonb_build_object('limit','30'),
    headers := jsonb_build_object(
      'Content-Type',              'application/json',
      'Authorization',             'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M',
      'x-harbourview-cron-caller', 'pg_cron_hv_score'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$function$;
