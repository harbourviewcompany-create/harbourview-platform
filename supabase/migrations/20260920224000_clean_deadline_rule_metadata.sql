-- Remove stale deadline-source metadata left by an earlier detector revision.
update public.signals
set analysis = analysis - 'deadline_source'
where analysis->>'deadline_source'='rules-v2'
  and coalesce(analysis->>'deadline','')='';
