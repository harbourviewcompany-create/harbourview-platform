-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260724112729.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Closing the loop I opened three times this session and never finished. Auditing my own
-- typical_timeline_months values against the platform's own standard (NULL = not assessed,
-- never store a fabricated placeholder): TR=18, MK=12, VC=9, MA=9, ZW=9 were my own professional
-- estimates with no citation behind them -- VC's own estimated_cost_range text even says so
-- explicitly ("no publicly quantified standard processing-time figure was identified"), which
-- means the number in the field was contradicting my own prose. Nulling those five.
-- LK=6 is the one exception, kept as-is: it matches the actual stated 6-month initial licence
-- term from the BOI export scheme I documented -- a real cited fact, not a guess.

UPDATE public.jurisdiction_playbooks
SET typical_timeline_months = NULL, updated_at = now()
WHERE country_iso2 IN ('TR','MK','VC','MA','ZW');
