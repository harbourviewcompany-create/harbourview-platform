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

if [[ "$branch" == "main" && ( "$commit_message" == *"[skip ci]"* || "$commit_message" == *"[docs only]"* ) ]]; then
  echo "Vercel ignore: main commit message requests skip ('$commit_message'); skip build."
  exit 0
fi

# Preview builds only (production already returned above): skip when the commit
# cannot change build output.
#
# On 2026-08-12 the account hit the Vercel free-plan cap
# ("api-deployments-free-per-day", >100/day). Every push on every branch built a
# preview, and with the repository carrying 350+ branches under heavy agent
# churn the budget was exhausted — which then blocks *production* deploys too,
# the failure mode this project can least afford.
#
# Only paths that provably cannot affect `next build` are skipped. Verified
# before adding: the project has no MDX pipeline, no markdown imports, and no
# build-time markdown reads, so docs and *.md are inert. Anything unrecognised,
# an unreadable diff, or a missing parent commit all fall through to building —
# the default is always to build.
if changed_files="$(git diff --name-only HEAD^ HEAD 2>/dev/null)" && [[ -n "$changed_files" ]]; then
  only_inert_paths=1
  while IFS= read -r changed_file; do
    [[ -z "$changed_file" ]] && continue
    case "$changed_file" in
      docs/*|*.md|.github/*|.claude/*|.vscode/*|LICENSE|CODEOWNERS) ;;
      *) only_inert_paths=0; break ;;
    esac
  done <<< "$changed_files"

  if [[ "$only_inert_paths" == "1" ]]; then
    echo "Vercel ignore: preview build skipped; commit touches only build-inert paths."
    echo "changed files:"
    printf '  %s\n' $changed_files
    exit 0
  fi
fi

echo "Vercel ignore: build allowed for branch '$branch'."
exit 1
