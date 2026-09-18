-- Restored from production migration ledger on 2026-09-16.
revoke insert, update, delete on regulatory_signals.sources from anon, authenticated;
revoke insert, update, delete on regulatory_signals.source_snapshots from anon;
