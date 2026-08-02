#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="$ROOT/docs/control/global-regulatory-os/canonical/db/migrations"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
export PGHOST PGPORT PGUSER PGPASSWORD="${PGPASSWORD:-postgres}"
CLEAN_DB="${CLEAN_DB:-hv_global_reg_clean}"
UPGRADE_DB="${UPGRADE_DB:-hv_global_reg_upgrade}"
mapfile -t MIGRATIONS < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort)
[[ ${#MIGRATIONS[@]} -eq 13 ]] || { echo "Expected 13 migrations, found ${#MIGRATIONS[@]}" >&2; exit 1; }
for db in "$CLEAN_DB" "$UPGRADE_DB"; do dropdb --if-exists "$db"; createdb "$db"; done
printf 'PostgreSQL: '; psql -d "$CLEAN_DB" -Atqc 'select version()'
for f in "${MIGRATIONS[@]}"; do echo "clean apply: $(basename "$f")"; psql -v ON_ERROR_STOP=1 -d "$CLEAN_DB" -f "$f"; done
psql -v ON_ERROR_STOP=1 -d "$CLEAN_DB" -f "$ROOT/tests/global-reg-os/sql/assert_schema.sql"
psql -v ON_ERROR_STOP=1 -d "$CLEAN_DB" -f "$ROOT/tests/global-reg-os/sql/assert_authorization_repository.sql"
psql -v ON_ERROR_STOP=1 -d "$CLEAN_DB" -f "$ROOT/tests/global-reg-os/sql/assert_public_leakage.sql"

psql -v ON_ERROR_STOP=1 -d "$UPGRADE_DB" -f "$ROOT/tests/global-reg-os/fixtures/existing_harbourview_baseline.sql"
for f in "${MIGRATIONS[@]:0:6}"; do echo "upgrade stage A: $(basename "$f")"; psql -v ON_ERROR_STOP=1 -d "$UPGRADE_DB" -f "$f"; done
psql -v ON_ERROR_STOP=1 -d "$UPGRADE_DB" <<'SQL'
INSERT INTO iam.tenants(slug,legal_name) VALUES ('upgrade-fixture','Upgrade Fixture');
INSERT INTO geo.jurisdictions(kind,canonical_code,name,status) VALUES ('country','TEST:UPGRADE','Upgrade Test Jurisdiction','approved');
SQL
for f in "${MIGRATIONS[@]:6}"; do echo "upgrade stage B: $(basename "$f")"; psql -v ON_ERROR_STOP=1 -d "$UPGRADE_DB" -f "$f"; done
psql -v ON_ERROR_STOP=1 -d "$UPGRADE_DB" -f "$ROOT/tests/global-reg-os/sql/assert_schema.sql"
psql -v ON_ERROR_STOP=1 -d "$UPGRADE_DB" -f "$ROOT/tests/global-reg-os/sql/assert_upgrade_preservation.sql"
psql -v ON_ERROR_STOP=1 -d "$UPGRADE_DB" -f "$ROOT/tests/global-reg-os/sql/assert_public_leakage.sql"
echo 'Global Regulatory OS PostgreSQL 17 clean-install and upgrade-path validation passed.'
