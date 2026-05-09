#!/usr/bin/env bash
set -euo pipefail

# Vercel ignore command contract:
#   exit 0 = ignore/skip this Vercel build
#   exit 1 = continue the Vercel build
#
# Deployment policy:
#   - Always build production deployments.
#   - Always build main.
#   - Always build release branches: release/*.
#   - Build preview branches only when the branch name or commit message
#     explicitly carries deploy intent.
#   - Skip WBCC-only verification changes.
#
# Deploy-intent markers:
#   - Branch starts with deploy/ or preview/
#   - Branch name contains deploy-preview
#   - Commit message contains [deploy-preview], [vercel-preview], or [preview]
#
# Fail-open rule:
#   Production, main and release branches fail open to build. Ambiguous preview
#   branches fail closed to skip unless explicit deploy intent is present.

branch="${VERCEL_GIT_COMMIT_REF:-}"
commit_message="${VERCEL_GIT_COMMIT_MESSAGE:-}"
vercel_env="${VERCEL_ENV:-}"
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
head="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

if [[ "$vercel_env" == "production" ]]; then
  echo "Vercel ignore: production environment detected; continue build."
  exit 1
fi

if [[ "$branch" == "main" ]]; then
  echo "Vercel ignore: main branch detected; continue production build."
  exit 1
fi

if [[ "$branch" == release/* ]]; then
  echo "Vercel ignore: release branch detected; continue preview build."
  exit 1
fi

if [[ "$branch" == deploy/* || "$branch" == preview/* || "$branch" == *deploy-preview* ]]; then
  echo "Vercel ignore: deploy-intent branch detected; continue preview build."
  exit 1
fi

if [[ "$commit_message" == *"[deploy-preview]"* || "$commit_message" == *"[vercel-preview]"* || "$commit_message" == *"[preview]"* ]]; then
  echo "Vercel ignore: deploy-intent commit marker detected; continue preview build."
  exit 1
fi

if [[ -z "$base" || "$base" == "0000000000000000000000000000000000000000" ]]; then
  base="HEAD^"
fi

# Vercel's shallow clone can omit VERCEL_GIT_PREVIOUS_SHA on old or rewritten
# branches. Never allow a missing comparison commit to fail the ignore command.
# Ambiguous non-production previews without deploy intent are skipped instead.
if ! git rev-parse --verify "${head}^{commit}" >/dev/null 2>&1; then
  echo "Vercel ignore: cannot resolve head ref '$head'; no preview deploy intent found; skip build."
  exit 0
fi

if ! git rev-parse --verify "${base}^{commit}" >/dev/null 2>&1; then
  echo "Vercel ignore: cannot resolve base ref '$base'; no preview deploy intent found; skip build."
  exit 0
fi

if ! changed_files="$(git diff --name-only "$base" "$head" 2>/tmp/vercel-ignore-git-diff.err)"; then
  echo "Vercel ignore: git diff failed for range '$base'..'$head'; no preview deploy intent found; skip build."
  cat /tmp/vercel-ignore-git-diff.err || true
  exit 0
fi

if [[ -z "$changed_files" ]]; then
  echo "Vercel ignore: no changed files detected; no preview deploy intent found; skip build."
  exit 0
fi

non_wbcc_files="$(printf '%s\n' "$changed_files" | grep -Ev '^(wbcc-verification-results/|wbcc-ci-package/|\.github/workflows/wbcc-windows-verification\.yml$)' || true)"

if [[ -z "$non_wbcc_files" ]]; then
  echo "Vercel ignore: WBCC-only change detected; skip deployment."
  printf '%s\n' "$changed_files"
  exit 0
fi

echo "Vercel ignore: preview branch has Harbourview-relevant changes but no deploy intent; skip build."
printf '%s\n' "$non_wbcc_files"
exit 0
