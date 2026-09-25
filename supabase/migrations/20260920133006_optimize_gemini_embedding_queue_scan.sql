-- Optimize oldest-first Gemini embedding queue selection.
create index if not exists idx_signals_pending_gemini_embedding
on public.signals (created_at asc)
where quality_label = 'signal' and embedding_gemini_1024 is null;
