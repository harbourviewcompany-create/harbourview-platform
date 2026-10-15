-- Replay-only reconstruction of the production Gemini embedding column.
--
-- Production has a 1024-dimensional Gemini embedding column on public.signals,
-- but the recovered repository migration history contains consumers of that
-- column without a canonical CREATE/ALTER COLUMN migration. This foundation
-- exists only in the temporary production-faithful replay workspace so later
-- historical migrations can execute. It is never a production migration or
-- migration-ledger entry.
alter table public.signals
  add column if not exists embedding_gemini_1024 vector(1024);
