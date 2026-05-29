#!/usr/bin/env bash
set -euo pipefail

# Vercel ignore command contract:
#   exit 0 = ignore/skip this Vercel build
#   exit 1 = continue this Vercel build
#
# Deployment-control policy:
#   - Never suppress production deployments from the canonical project.
#   - Build production/main, preview/* and deploy/*.
#   - Skip ordinary feature/*, fix/*, cloudflare/*, vercel/* and bot-generated branches.
#   - Skip all other unrecognized non-production branches by default.
#
# Critical ordering rule:
#   VERCEL_ENV=production must be checked before URL duplicate detection. Vercel
#   deployment URLs commonly include the team slug, so URL-based duplicate checks
#   can otherwise suppress the real production deployment.

branch="${VERCEL_GIT_COMMIT_REF:-${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}}"
commit_message="${VERCEL_GIT_COMMIT_MESSAGE:-${GITHUB_COMMIT_MESSAGE:-${COMMIT_MESSAGE:-}}}"
vercel_env="${VERCEL_ENV:-}"
project_id="${VERCEL_PROJECT_ID:-}"
project_production_url="${VERCEL_PROJECT_PRODUCTION_URL:-}"
deployment_url="${VERCEL_URL:-}"
branch_url="${VERCEL_BRANCH_URL:-}"

# Production deploys are authoritative. Do not let duplicate URL heuristics skip
# a production build for the canonical Harbourview project.
if [[ "$vercel_env" == "production" ]]; then
  echo "Vercel ignore: production environment detected; continue build."
  exit 1
fi

is_known_duplicate_project_id() {
  local candidate="${1:-}"

  case "$candidate" in
    prj_zlwnDnFFs7rJa42QQn1cElFRYY7E|\
    prj_JeAGIr5pjCSSwfAAXaqjXPceDrSW)
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
    harbourview-network-*|*.harbourview-network-*|*harbourview-network-*|harbourview-platform-*|*.harbourview-platform-*|*harbourview-platform-*)
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
  echo "Vercel ignore: branch unknown in non-production context; skip build to avoid uncontrolled preview deployment."
  exit 0
fi

case "$branch" in
  main)
    if [[ "$commit_message" == *"[skip ci]"* || "$commit_message" == *"[docs only]"* ]]; then
      echo "Vercel ignore: main commit message requests skip ('$commit_message'); skip build."
      exit 0
    fi
    echo "Vercel ignore: build allowed for branch '$branch'."
    exit 1
    ;;
  preview/*|deploy/*)
    echo "Vercel ignore: build allowed for branch '$branch'."
    exit 1
    ;;
  feature/*|feat/*|fix/*|ops/*|cloudflare/*|vercel/*|dependabot/*|renovate/*|github-actions/*|bot/*|codex/*|admin-*|chore/*|refactor/*|docs/*)
    echo "Vercel ignore: skipping non-allowlisted branch '$branch'."
    exit 0
    ;;
  *)
    echo "Vercel ignore: branch '$branch' is not allowlisted; skip build."
    exit 0
    ;;
esac

