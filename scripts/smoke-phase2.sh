#!/usr/bin/env bash
# Phase 2 public surface smoke — operator-run against production or preview.
set -euo pipefail
BASE="${BASE:-https://harbourview.vercel.app}"
FAIL=0

check() {
  local path="$1"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${BASE}${path}" || echo "000")
  if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
    echo "OK  $code  $path"
  else
    echo "FAIL $code  $path"
    FAIL=1
  fi
}

echo "Smoke against $BASE"
check "/intelligence/corridor-plan?origin=CA&destination=DE"
check "/intelligence/corridor-coverage"
check "/intelligence/landed-cost?origin=CA&destination=DE&product=flower-premium&volume=10"
check "/intelligence/logistics-simulator"
check "/marketplace/genetics"
check "/education/cpd"
check "/marketplace/financing"
check "/manifest.webmanifest"
check "/api/corridor-plan?origin=CA&destination=DE"
check "/api/corridor-coverage"
check "/api/landed-cost?origin=CA&destination=DE&product=flower-premium&volume=10"
check "/api/landed-cost?meta=1"

if [[ "$FAIL" -ne 0 ]]; then
  echo "One or more checks failed."
  exit 1
fi
echo "All public Phase 2 checks passed."
