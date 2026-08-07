-- Production version 20260701191208 is fix_cron_trigger_auth_headers_v2.
-- Its original remote statement embeds project-specific authorization material
-- and must not be replayed into local, preview, or another production project.
--
-- The unrelated match-rationale schema delta is restored at its canonical
-- production version, 20260630233905. This file remains an explicit migration
-- ledger reconciliation marker only.
select 1;
