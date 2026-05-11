#!/usr/bin/env bash
set -euo pipefail

# Vercel ignore command contract:
#   exit 0 = ignore/skip this Vercel build
#   exit 1 = continue this Vercel build
#
# Duplicate project guard:
#   - Canonical production domain: harbourview.vercel.app.
#   - Canonical GitHub status context observed for that production project:
#     "Vercel – harbourview".
#   - Known duplicate/stale Vercel projects must not consume build quota or
#     create duplicate GitHub status contexts.
#   - Known duplicate Vercel project id:
#       prj_zlwnDnFFs7rJa42QQn1cElFRYY7E  harbourview-network
#   - Known duplicate URL/account signals:
#       harbourview-network-*.vercel.app
#       harbourview-platform-*.vercel.app
#       *-harbourviewnetwork.vercel.app
#       *.harbourviewnetwork.vercel.app
#   - Unknown project identity falls through to the normal branch policy so the
#     canonical production project is not accidentally blocked.
#
# Deployment policy:
#   - Always build production deployments unless the project is known duplicate.
#   - Always build main unless the project is known duplicate.
#   - Always build release branches: release/* unless known duplicate.
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
#   Unknown project identity falls through to the branch policy rather than
#   risking an accidental canonical production block. Ambiguous preview branches
#   still fail closed to skip unless explicit deploy intent is present.

branch="${VERCEL_GIT_COMMIT_REF:-}"
commit_message="${VERCEL_GIT_COMMIT_MESSAGE:-}"
vercel_env="${VERCEL_ENV:-}"
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
head="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
project_id="${VERCEL_PROJECT_ID:-}"
project_production_url="${VERCEL_PROJECT_PRODUCTION_URL:-}"
deployment_url="${VERCEL_URL:-}"
branch_url="${VERCEL_BRANCH_URL:-}"

is_known_duplicate_project_id() {
  local candidate="${1:-}"

  case "$candidate" in
    prj_zlwnDnFFs7rJa42QQn1cElFRYY7E)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_known_duplicate_url() {
  local candidate="${1:-}"

  [[ -z "$candidate" ]] && return 1

  case "$candidate" in
    harbourview-network-*|*.harbourview-network-*|*harbourview-network-*|harbourview-platform-*|*.harbourview-platform-*|*harbourview-platform-*|*-harbourviewnetwork.vercel.app|*.harbourviewnetwork.vercel.app|*harbourviewnetwork.vercel.app)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if [[ -n "$project_id" ]] && is_known_duplicate_project_id "$project_id"; then
  echo "Vercel ignore: known duplicate Harbourview project id '$project_id' detected; skip build."
  exit 0
fi

if is_known_duplicate_url "$project_production_url" || is_known_duplicate_url "$deployment_url" || is_known_duplicate_url "$branch_url"; then
  echo "Vercel ignore: known duplicate Harbourview deployment URL detected; skip build."
  echo "production_url=${project_production_url:-<unset>} deployment_url=${deployment_url:-<unset>} branch_url=${branch_url:-<unset>}"
  exit 0
fi

if [[ -n "$project_id" ]]; then
  echo "Vercel ignore: project id '$project_id' is not in duplicate denylist; evaluate branch deployment policy."
else
  echo "Vercel ignore: project id not exposed and no duplicate URL detected; evaluate branch deployment policy."
fi

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

if printf '%s\n' "$non_wbcc_files" | grep -Eq '^(package\.json|package-lock\.json|app/|components/|lib/|scripts/test-|tests/)'; then
  echo "Vercel ignore: preview branch changed build/runtime/verification files; continue build."
  printf '%s\n' "$non_wbcc_files"
  exit 1
fi

echo "Vercel ignore: preview branch has Harbourview-relevant changes but no deploy intent; skip build."
printf '%s\n' "$non_wbcc_files"
exit 0
