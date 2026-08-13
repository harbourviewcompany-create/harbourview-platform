#!/usr/bin/env bash
set -euo pipefail

# Vercel ignore command contract:
#   exit 0 = ignore/skip this Vercel build
#   exit 1 = continue this Vercel build
#
# Harbourview deployment policy:
#   - Production deployments must always build.
#   - The canonical Vercel project must build previews for normal PR branches.
#   - Known duplicate/legacy Harbourview projects must skip non-production builds.
#   - This script must not block ordinary feature/fix/ops/codex preview branches.

branch="${VERCEL_GIT_COMMIT_REF:-${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}}"
commit_message="${VERCEL_GIT_COMMIT_MESSAGE:-${GITHUB_COMMIT_MESSAGE:-${COMMIT_MESSAGE:-}}}"
vercel_env="${VERCEL_ENV:-}"
project_id="${VERCEL_PROJECT_ID:-}"
project_production_url="${VERCEL_PROJECT_PRODUCTION_URL:-}"
deployment_url="${VERCEL_URL:-}"
branch_url="${VERCEL_BRANCH_URL:-}"

canonical_project_id="prj_Zp8HBDstqAAOCN6W7LAElahsq3qS"

# Production deploys are authoritative. Never suppress them.
if [[ "$vercel_env" == "production" ]]; then
  echo "Vercel ignore: production environment detected; continue build."
  exit 1
fi

is_known_duplicate_project_id() {
  local candidate="${1:-}"

  case "$candidate" in
    prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ|prj_zlwnDnFFs7rJa42QQn1cElFRYY7E|prj_JeAGIr5pjCSSwfAAXaqjXPceDrSW)
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
    harbourview-git-*-wurx.vercel.app|\
    harbourview-*-wurx.vercel.app|\
    *-wurx.vercel.app|\
    harbourview-network-*|*.harbourview-network-*|*harbourview-network-*|\
    harbourview-platform-*|*.harbourview-platform-*|*harbourview-platform-*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if [[ -n "$project_id" ]] && is_known_duplicate_project_id "$project_id"; then
  echo "Vercel ignore: known duplicate Harbourview project id '$project_id' detected; skip non-production build."
  exit 0
fi

if is_known_duplicate_url "$project_production_url" || is_known_duplicate_url "$deployment_url" || is_known_duplicate_url "$branch_url"; then
  echo "Vercel ignore: known duplicate Harbourview deployment URL detected; skip non-production build."
  echo "production_url=${project_production_url:-<unset>} deployment_url=${deployment_url:-<unset>} branch_url=${branch_url:-<unset>}"
  exit 0
fi

if [[ -z "$branch" ]]; then
  if [[ "$project_id" == "$canonical_project_id" ]]; then
    echo "Vercel ignore: canonical project with unknown branch; continue build."
    exit 1
  fi

  echo "Vercel ignore: branch unknown in non-production context; skip build to avoid uncontrolled duplicate preview deployment."
  exit 0
fi

# Previously only checked on `main`. Broadened to any branch: this is an
# explicit, opt-in per-commit marker (not a blanket branch skip), so it
# doesn't touch the "must not block ordinary preview branches" policy above
# - it just lets a docs/config-only commit on any branch opt out the same
# way a docs/config-only commit on main already could. Production is still
# unconditionally protected by the vercel_env check earlier in this script,
# regardless of commit message.
if [[ "$commit_message" == *"[skip ci]"* || "$commit_message" == *"[docs only]"* ]]; then
  echo "Vercel ignore: commit message requests skip ('$commit_message') on branch '$branch'; skip build."
  exit 0
fi

echo "Vercel ignore: build allowed for branch '$branch'."
exit 1
