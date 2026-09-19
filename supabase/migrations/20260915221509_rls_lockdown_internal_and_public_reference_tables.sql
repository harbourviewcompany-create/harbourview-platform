-- Enable RLS on 7 tables flagged by the Supabase security advisor as
-- exposed to the anon key with no RLS at all.
--
-- country_cannabis_legal_status is genuinely public reference data (this
-- product's whole purpose is cannabis legal intel) -- gets an explicit
-- public SELECT policy, writes stay service_role-only (no policy = only
-- service_role, which bypasses RLS, can write).
--
-- The other 6 are internal job/queue/ML-state tables with no end-user read
-- need. Following this repo's own established convention (see the
-- `dossiers` table's admin_operator_select policy) for internal/ops data:
-- admin/operator SELECT only, writes stay service_role-only.

alter table public.country_cannabis_legal_status enable row level security;
alter table public.source_discovery_jobs enable row level security;
alter table public.source_discovery_attempts enable row level security;
alter table public.hv_gemini_embed_queue enable row level security;
alter table public.hv_gemini_key_rotation enable row level security;
alter table public.hv_gemini_key_cooldown enable row level security;
alter table public.hv_local_classifier_centroids enable row level security;

drop policy if exists country_cannabis_legal_status_public_read on public.country_cannabis_legal_status;
create policy country_cannabis_legal_status_public_read
on public.country_cannabis_legal_status for select
to anon, authenticated
using (true);

do $$
declare t text;
begin
  foreach t in array array[
    'source_discovery_jobs',
    'source_discovery_attempts',
    'hv_gemini_embed_queue',
    'hv_gemini_key_rotation',
    'hv_gemini_key_cooldown',
    'hv_local_classifier_centroids'
  ] loop
    execute format('drop policy if exists %I_admin_operator_select on public.%I', t, t);
    execute format($p$
      create policy %I_admin_operator_select on public.%I for select
      to authenticated
      using (exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid() and ur.role in ('admin','operator')
      ))
    $p$, t, t);
  end loop;
end $$;
