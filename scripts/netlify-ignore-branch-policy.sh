#!/usr/bin/env bash
set -euo pipefail

# Netlify build ignore command contract:
#   exit 0 = ignore/cancel build
#   exit 1 = continue build
#
# Policy:
#   - Build only main, preview/* and deploy/*.
#   - Ignore ordinary feature/*, fix/*, cloudflare/*, vercel/* and bot/generated branches.
#   - Ignore all other unrecognized branches by default.

branch="${BRANCH:-${HEAD:-${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}}}"
context="${CONTEXT:-}"

if [[ "$context" == "production" || "$branch" == "main" ]]; then
  echo "Netlify ignore: production/main build allowed."
  exit 1
fi

if [[ -z "$branch" ]]; then
  echo "Netlify ignore: branch unknown outside production; cancel build."
  exit 0
fi

case "$branch" in
  preview/*|deploy/*)
    echo "Netlify ignore: deploy-intent branch '$branch' allowed."
    exit 1
    ;;
  feature/*|fix/*|cloudflare/*|vercel/*|dependabot/*|renovate/*|github-actions/*|bot/*|codex/*)
    echo "Netlify ignore: branch '$branch' canceled."
    exit 0
    ;;
  *)
    echo "Netlify ignore: branch '$branch' is not allowlisted; cancel build."
    exit 0
    ;;
esac
