-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260923093637
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.source_registry set source_url='https://idfpr.illinois.gov/profs/adultusecan.html',updated_at=now() where id='91403b9c-8369-4add-8614-a4f5b4570b34';
