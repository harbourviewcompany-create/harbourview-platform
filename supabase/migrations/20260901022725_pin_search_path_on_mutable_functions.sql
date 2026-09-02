-- Reconstructed from production. Verbatim statements for version 20260901022725.
alter function public.set_updated_at() set search_path = 'public';
alter function public.hv_truncate_at_word_boundary(text, integer) set search_path = 'public';
alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = 'public';
alter function public.hv_local_classify_gate(vector) set search_path = 'public';
alter function public._digest_smart_truncate(text, integer) set search_path = 'public';
alter function public._digest_manual_why(text, text, text, text, text) set search_path = 'public';
alter function public._backfill_strip_site_suffix(text, text) set search_path = 'public';
