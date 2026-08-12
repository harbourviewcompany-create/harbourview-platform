#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CANONICAL="$ROOT/docs/control/global-regulatory-os/canonical"
: "${PGHOST:=127.0.0.1}" "${PGPORT:=5432}" "${PGUSER:=postgres}" "${PGPASSWORD:=postgres}"
export PGHOST PGPORT PGUSER PGPASSWORD

run_db() {
  local db="$1"
  createdb "$db"
  for migration in "$CANONICAL"/db/migrations/*.sql; do
    PGDATABASE="$db" psql -v ON_ERROR_STOP=1 -f "$migration"
  done
  PGDATABASE="$db" psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/authorization_setup.sql"
  PGDATABASE="$db" PGUSER=hv_untrusted_test PGPASSWORD=untrusted-test-password psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/authorization_negative.sql"
  PGDATABASE="$db" PGUSER=hv_trusted_test PGPASSWORD=trusted-test-password psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/authorization_trusted.sql"
}

clean_db="gros_clean_${RANDOM}_$$"
upgrade_db="gros_upgrade_${RANDOM}_$$"
trap 'dropdb --if-exists "$clean_db"; dropdb --if-exists "$upgrade_db"' EXIT

run_db "$clean_db"
createdb "$upgrade_db"
PGDATABASE="$upgrade_db" psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/simulated_harbourview_prestate.sql"

bootstrap_migration="$CANONICAL/db/migrations/0001_extensions_and_enums.sql"
PGDATABASE="$upgrade_db" psql -v ON_ERROR_STOP=1 -f "$bootstrap_migration"
PGDATABASE="$upgrade_db" psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/simulated_harbourview_role_bootstrap_assert.sql"

for migration in "$CANONICAL"/db/migrations/*.sql; do
  if [[ "$migration" == "$bootstrap_migration" ]]; then
    continue
  fi
  PGDATABASE="$upgrade_db" psql -v ON_ERROR_STOP=1 -f "$migration"
done
PGDATABASE="$upgrade_db" psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/simulated_harbourview_assert.sql"
PGDATABASE="$upgrade_db" psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/authorization_setup.sql"
PGDATABASE="$upgrade_db" PGUSER=hv_untrusted_test PGPASSWORD=untrusted-test-password psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/authorization_negative.sql"
PGDATABASE="$upgrade_db" PGUSER=hv_trusted_test PGPASSWORD=trusted-test-password psql -v ON_ERROR_STOP=1 -f "$CANONICAL/tests/sql/authorization_trusted.sql"

echo 'PASS: PostgreSQL clean install, hostile-role bootstrap normalization, simulated Harbourview upgrade, trusted context, RLS and negative escalation tests'
