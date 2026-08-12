#!/usr/bin/env bash
# Backfills supabase/migrations/*.sql for every migration that's applied live
# but has no corresponding committed file (the "live-ahead" drift direction —
# the dangerous one, since it means schema changes exist in prod that aren't
# in version control at all).
#
# Run this from an environment with real network access to the Supabase
# project's Postgres connection (not from Claude's sandbox — that's blocked
# by egress allowlist, which is why this was written as a script instead of
# executed inline). Needs SUPABASE_DB_URL or equivalent psql connection env.
#
# As of 2026-08-12, this covers 58 versions. Confirmed via:
#   comm -13 <(ls supabase/migrations | grep -oE '^[0-9]{14}' | sort) \
#            <(psql "$SUPABASE_DB_URL" -tAc \
#              "select version from supabase_migrations.schema_migrations order by version")
#
# Re-run that comm command first if time has passed — new drift may have
# accumulated since this list was captured, and this script will silently
# skip anything not in LIVE_ONLY_VERSIONS below.

set -euo pipefail

MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/supabase/migrations"

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL is not set. Export it (postgres connection string with" >&2
  echo "read access to supabase_migrations.schema_migrations) and re-run." >&2
  exit 1
fi

LIVE_ONLY_VERSIONS=(
  20260727213922 20260728191340 20260728192052 20260729021338 20260729021608
  20260729021709 20260729021820 20260729095416 20260729102231 20260729230849
  20260729233712 20260730003050 20260730103137 20260730104444 20260730104633
  20260730112133 20260730112457 20260730112526 20260730112536 20260730112600
  20260730112630 20260730160830 20260730160833 20260730161011 20260730161013
  20260730161318 20260730182043 20260730182145 20260730182606 20260730184257
  20260730185321 20260730211141 20260730211147 20260730211325 20260730211507
  20260730211621 20260730211756 20260730212129 20260730220913 20260730221151
  20260730222127 20260730222807 20260730223248 20260730223308 20260731004024
  20260731090302 20260731110914 20260801144813 20260802011926 20260802014521
  20260802134657 20260804222954 20260807181844 20260807181907 20260807182104
  20260808202814 20260808203859 20260812000445
)

echo "Backfilling ${#LIVE_ONLY_VERSIONS[@]} migration files into $MIGRATIONS_DIR"
echo

count=0
for version in "${LIVE_ONLY_VERSIONS[@]}"; do
  # Skip if a file for this version already exists (idempotent re-runs, or
  # this one was already handled manually - e.g. 20260727213922 was already
  # backfilled by hand and verified byte-exact as a proof of concept).
  if ls "$MIGRATIONS_DIR/${version}"_*.sql >/dev/null 2>&1; then
    echo "  [skip] $version - file already exists"
    continue
  fi

  row=$(psql "$SUPABASE_DB_URL" -tAc "
    select name || E'\x01' || array_to_string(statements, E'\n\n')
    from supabase_migrations.schema_migrations
    where version = '${version}'
  ")

  if [ -z "$row" ]; then
    echo "  [WARN] $version - no row found live, skipping (may have been reconciled already)" >&2
    continue
  fi

  name="${row%%$'\x01'*}"
  content="${row#*$'\x01'}"
  outfile="$MIGRATIONS_DIR/${version}_${name}.sql"

  printf '%s' "$content" > "$outfile"
  echo "  [ok]   $version -> $(basename "$outfile") ($(wc -c < "$outfile") bytes)"
  count=$((count + 1))
done

echo
echo "Wrote $count new migration files."
echo "Next steps:"
echo "  1. Review the diff: git status && git diff --stat supabase/migrations/"
echo "  2. Spot-check a few files against the live statements column for sanity"
echo "  3. Run the drift check locally if possible before committing:"
echo "     node scripts/migration-ledger-manifest.mjs --mode drift"
echo "  4. Commit on a branch, open a PR - do NOT push straight to main"
echo "  5. This only fixes the 'live-ahead' direction. It does not address why"
echo "     migrations are reaching prod without being committed in the first"
echo "     place - that's a credentials/workflow problem, not a data problem,"
echo "     and this script is a one-time catch-up, not a permanent fix."
