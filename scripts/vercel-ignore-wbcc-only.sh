#!/usr/bin/env bash
set -euo pipefail

# Vercel ignore command contract:
#   exit 0 = ignore/skip this Vercel build
#   exit 1 = continue this Vercel build
#
# Harbourview deployment policy:
#   - Production deployments must always build.
#   - Previews are OFF by default and opt-in per commit via [preview].
#   - Known duplicate/legacy Harbourview projects must skip non-production builds.
#
# The preview default was inverted on 2026-08-14. It previously read "the
# canonical Vercel project must build previews for normal PR branches", and that
# is what exhausted the quota: every push to every open PR built a preview, and
# the free plan allows 100 deployments/day. On 2026-08-13 the cap was hit twice
# in one day ("api-deployments-free-per-day", >100), and the second time it also
# blocked #1398, #1367 and #1410 with `Deployment rate limited - retry in 24
# hours` on pull requests whose own diffs were fine.
#
# The failure mode that matters is not a missing preview URL. It is that a
# spent preview budget blocks PRODUCTION deploys from the same daily pool --
# exactly the risk the earlier revision of this file set out to avoid, arrived
# at anyway because the per-commit opt-outs it relied on never fired often
# enough against sustained agent churn across 350+ branches.
#
# So the default is inverted rather than tuned. Production is unconditional.
# A preview is still available whenever it is actually wanted: put [preview] in
# the commit message. That keeps the budget for production and for the handful
# of commits a human genuinely wants to look at before merging.

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
  if [[ "$project_id" != "$canonical_project_id" ]]; then
    echo "Vercel ignore: branch unknown in non-production context; skip build to avoid uncontrolled duplicate preview deployment."
    exit 0
  fi

  # Canonical project with an unknown branch. This used to build
  # unconditionally, which under the opt-in policy below would have been a hole
  # straight through it: a preview with no branch name would deploy while every
  # named branch was being skipped. It now falls through to the same [preview]
  # gate as everything else.
  echo "Vercel ignore: canonical project with unknown branch; deferring to the preview opt-in gate."
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

# Previews are opt-in. Everything below this point is a preview build, because
# production returned at the top of the script.
#
# Deliberately placed before the build-inert path check: that check exists to
# spare the budget on docs-only commits, and with previews off by default there
# is no budget left to spare. It stays in the file because it still applies to
# any commit that opts back in.
#
# The marker is read from the SUBJECT LINE ONLY, not the whole message. The
# first version of this gate substring-matched the entire commit message, and
# the very commit that introduced it deployed a preview it was supposed to
# suppress -- because the body explained the feature and therefore contained the
# marker as prose. Anything that documents, reverts or discusses this mechanism
# would have opted itself in.
#
# Note the asymmetry with [skip ci]/[docs only] above, which still match the
# whole message. Those fail SAFE: a stray mention skips a build that was going
# to be free anyway. This one fails OPEN, and an accidental match spends the
# budget this file exists to protect, so it gets the stricter rule.
commit_subject="${commit_message%%$'\n'*}"

if [[ "$commit_subject" == *"[preview]"* ]]; then
  echo "Vercel ignore: subject line opts in ('[preview]') on branch '$branch'; continue preview build."
else
  echo "Vercel ignore: previews are opt-in; skipping preview build for branch '$branch'."
  echo "Add [preview] to the commit SUBJECT line to build one. Production deploys are unaffected."
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
