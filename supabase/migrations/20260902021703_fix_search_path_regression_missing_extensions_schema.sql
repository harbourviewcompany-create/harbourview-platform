-- Reconstructed from production. Verbatim statements for version 20260902021703.
alter function public.hv_embed_harvest() set search_path = 'public, extensions';
-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260902021703$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path = ''public, extensions'';';
  end if;
end
$replay_hv_local_classify_gate_20260902021703$;
-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260902021703$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = ''public, extensions'';';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260902021703$;
