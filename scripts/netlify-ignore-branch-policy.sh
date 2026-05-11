#!/usr/bin/env bash
set -euo pipefail

# Netlify build ignore command contract:
#   exit 0 = continue build
#   exit 1 = ignore/cancel build
#
# Policy:
#   - Build only main, preview/* and deploy/*.
#   - Ignore ordinary feature/*, fix/*, cloudflare/*, vercel/* and bot/generated branches.
#   - Ignore all other unrecognized branches by default.

branch="${BRANCH:-${HEAD:-${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}}}"
context="${CONTEXT:-}"

if [[ "$context" == "production" || "$branch" == "main" ]]; then
  echo "Netlify ignore: production/main build allowed."
  exit 0
fi

if [[ -z "$branch" ]]; then
  echo "Netlify ignore: branch unknown outside production; ignore build."
  exit 1
fi

case "$branch" in
  preview/*|deploy/*)
    echo "Netlify ignore: deploy-intent branch '$branch' allowed."
    exit 0
    ;;
  feature/*|fix/*|cloudflare/*|vercel/*|dependabot/*|renovate/*|github-actions/*|bot/*|codex/*)
    echo "Netlify ignore: branch '$branch' ignored."
    exit 1
    ;;
  *)
    echo "Netlify ignore: branch '$branch' is not allowlisted; ignore build."
    exit 1
    ;;
esac
