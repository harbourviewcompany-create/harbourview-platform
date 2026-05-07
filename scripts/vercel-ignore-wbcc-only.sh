#!/usr/bin/env bash
set -euo pipefail

# Vercel ignore command contract:
#   exit 0 = ignore/skip this Vercel build
#   exit 1 = continue the Vercel build
# This skips deployments only when the pushed diff contains WBCC-only
# verification files or WBCC workflow maintenance. Harbourview app,
# public route, Supabase, auth, marketplace, copy and asset changes
# continue to build normally.

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
head="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

if [[ -z "$base" || "$base" == "0000000000000000000000000000000000000000" ]]; then
  base="HEAD^"
fi

if ! git rev-parse --verify "$base" >/dev/null 2>&1; then
  echo "Vercel ignore: cannot resolve base ref; continue build."
  exit 1
fi

changed_files="$(git diff --name-only "$base" "$head")"

if [[ -z "$changed_files" ]]; then
  echo "Vercel ignore: no changed files detected; continue build."
  exit 1
fi

non_wbcc_files="$(printf '%s\n' "$changed_files" | grep -Ev '^(wbcc-verification-results/|wbcc-ci-package/|\.github/workflows/wbcc-windows-verification\.yml$)' || true)"

if [[ -z "$non_wbcc_files" ]]; then
  echo "Vercel ignore: WBCC-only change detected; skip deployment."
  printf '%s\n' "$changed_files"
  exit 0
fi

echo "Vercel ignore: Harbourview-relevant change detected; continue build."
printf '%s\n' "$non_wbcc_files"
exit 1
