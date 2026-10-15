-- Reconstructed from production. Verbatim statements for version 20260901022725.
alter function public.set_updated_at() set search_path = 'public';
alter function public.hv_truncate_at_word_boundary(text, integer) set search_path = 'public';
-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260901022725$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = ''public'';';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260901022725$;
-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260901022725$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path = ''public'';';
  end if;
end
$replay_hv_local_classify_gate_20260901022725$;
alter function public._digest_smart_truncate(text, integer) set search_path = 'public';
alter function public._digest_manual_why(text, text, text, text, text) set search_path = 'public';
alter function public._backfill_strip_site_suffix(text, text) set search_path = 'public';
