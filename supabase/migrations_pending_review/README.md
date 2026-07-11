This directory holds migration SQL that has been written and reviewed
but deliberately NOT YET applied to the database.

Files here are NOT picked up by `supabase db push` or any CI workflow --
that's the point. `supabase/migrations/` requires every file to carry a
valid 14-digit timestamp prefix; Supabase CLI parses and validates every
file in that directory on every run, so a draft file without a real
version number breaks `db push` outright (confirmed 2026-07-11: three such
files -- lacking timestamps -- were sitting in supabase/migrations/ and
were the actual cause of the "Push migrations" CI step failing on every
run, independent of and in addition to the migration-history-drift issue
fixed earlier the same week).

Convention going forward:
  1. Write the draft .sql here, with a normal descriptive filename
     (no timestamp needed -- that's what marks it as "not yet real").
  2. When it's reviewed and ready to actually apply: run it via
     Supabase MCP `apply_migration` (which assigns the real timestamp),
     then in that SAME session/PR, move the file from here into
     `supabase/migrations/` renamed to `{that timestamp}_{name}.sql`,
     and delete it from this directory.
  3. Never leave a draft with the same content sitting in both places --
     once applied, the version in supabase/migrations/ is the only
     copy that should exist.

Do not point any tooling at this directory expecting it to be scanned;
it deliberately isn't.
