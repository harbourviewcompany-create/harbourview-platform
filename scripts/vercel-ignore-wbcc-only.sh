#!/usr/bin/env bash
set -euo pipefail

# Vercel ignore command contract:
#   exit 0 = ignore/skip this Vercel build
#   exit 1 = continue the Vercel build
#
# Canonical project guard:
#   - Canonical Vercel project: harbourview in the harbourviewnetwork team.
#   - Canonical project id: prj_FiWMX10YY6MDo2WbTDVUKe6QWF8c.
#   - Stale duplicate contexts must not consume build quota.
#   - If VERCEL_PROJECT_ID is exposed and does not match the canonical id,
#     skip immediately before any production/main branch allow rule.
#   - If VERCEL_PROJECT_ID is not exposed, fall back to generated/project URLs
#     that distinguish the stale harbourview-platform project from the canonical
#     harbourview project.
#
# Deployment policy:
#   - Always build the canonical production deployment.
#   - Always build canonical main.
#   - Always build canonical release branches: release/*.
#   - Build canonical preview branches only when the branch name or commit message
#     explicitly carries deploy intent.
#   - Skip WBCC-only verification changes.
#
# Deploy-intent markers:
#   - Branch starts with deploy/ or preview/
#   - Branch name contains deploy-preview
#   - Commit message contains [deploy-preview], [vercel-preview], or [preview]
#
# Fail-open rule:
#   Canonical production, main and release branches fail open to build. Ambiguous
#   preview branches fail closed to skip unless explicit deploy intent is present.
#   Unknown project identity falls through to the branch policy rather than
#   risking an accidental canonical production block.

branch="${VERCEL_GIT_COMMIT_REF:-}"
commit_message="${VERCEL_GIT_COMMIT_MESSAGE:-}"
vercel_env="${VERCEL_ENV:-}"
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
head="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
project_id="${VERCEL_PROJECT_ID:-}"
project_production_url="${VERCEL_PROJECT_PRODUCTION_URL:-}"
deployment_url="${VERCEL_URL:-}"
branch_url="${VERCEL_BRANCH_URL:-}"

canonical_project_id="prj_FiWMX10YY6MDo2WbTDVUKe6QWF8c"

is_stale_harbourview_platform_url() {
  local candidate="${1:-}"

  [[ -z "$candidate" ]] && return 1

  case "$candidate" in
    harbourview-platform-*|*.harbourview-platform-*|*harbourview-platform-*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_known_canonical_project_url() {
  local candidate="${1:-}"

  [[ -z "$candidate" ]] && return 1

  case "$candidate" in
    harbourview.vercel.app|harbourview-harbourviewnetwork.vercel.app|harbourview-git-main-harbourviewnetwork.vercel.app|harbourview-*-harbourviewnetwork.vercel.app|harbourview-git-*-harbourviewnetwork.vercel.app)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if [[ -n "$project_id" ]]; then
  if [[ "$project_id" != "$canonical_project_id" ]]; then
    echo "Vercel ignore: non-canonical project id '$project_id' detected; skip duplicate Harbourview build."
    exit 0
  fi

  echo "Vercel ignore: canonical project id detected; evaluate branch deployment policy."
elif is_stale_harbourview_platform_url "$project_production_url" || is_stale_harbourview_platform_url "$deployment_url" || is_stale_harbourview_platform_url "$branch_url"; then
  echo "Vercel ignore: stale harbourview-platform deployment URL detected; skip duplicate Harbourview build."
  exit 0
elif [[ -n "$project_production_url" ]] && ! is_known_canonical_project_url "$project_production_url"; then
  echo "Vercel ignore: non-canonical production URL '$project_production_url' detected; skip duplicate Harbourview build."
  exit 0
else
  echo "Vercel ignore: project id not exposed; no stale project URL detected; evaluate branch deployment policy."
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
