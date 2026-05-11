#!/usr/bin/env bash
set -euo pipefail

APP_USER="harbourview"
APP_ROOT="/opt/harbourview"
REPO_URL="https://github.com/harbourviewcompany-create/harbourview-platform.git"
BRANCH="deploy/self-host-portability"
DOMAIN="staging.harbourview.co"
APP_PORT="3000"
PREFLIGHT_PORT="3001"
MIN_FREE_MB="2048"
LOCK_FILE="/tmp/harbourview-self-host-deploy.lock"
ENV_FILE="$APP_ROOT/shared/.env.production"
LOG_DIR="$APP_ROOT/logs"
RELEASES_DIR="$APP_ROOT/releases"
METADATA_DIR="$APP_ROOT/shared/deploy-metadata"
KEEP_RUNTIME_RELEASES="5"
PREVIOUS_CURRENT=""
PREFLIGHT_PID=""
ACTIVATED="0"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

cleanup_preflight() {
  if [ -n "$PREFLIGHT_PID" ]; then
    if kill -0 "$PREFLIGHT_PID" >/dev/null 2>&1; then
      kill "$PREFLIGHT_PID" >/dev/null 2>&1 || true
      wait "$PREFLIGHT_PID" >/dev/null 2>&1 || true
    fi
    PREFLIGHT_PID=""
  fi
}

rollback() {
  cleanup_preflight

  if [ "$ACTIVATED" = "1" ] && [ -n "$PREVIOUS_CURRENT" ]; then
    echo "Rolling back to previous release: $PREVIOUS_CURRENT"
    ln -sfn "$PREVIOUS_CURRENT" "$APP_ROOT/current"
    systemctl restart harbourview || true
  fi
}

on_error() {
  echo "HOLD: deployment failed. Entering rollback/cleanup path."
  rollback
  echo "Recent harbourview logs:"
  journalctl -u harbourview -n 80 --no-pager || true
  echo "Recent Caddy logs:"
  journalctl -u caddy -n 40 --no-pager || true
}

trap on_error ERR
trap cleanup_preflight EXIT

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root."
  exit 1
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another Harbourview deployment is already running."
  exit 1
fi

require_command git
require_command npm
require_command node
require_command curl
require_command caddy
require_command systemctl
require_command flock
require_command ss

mkdir -p "$LOG_DIR"
mkdir -p "$RELEASES_DIR"
mkdir -p "$METADATA_DIR"
chown -R "$APP_USER:$APP_USER" "$LOG_DIR" "$RELEASES_DIR" "$METADATA_DIR"

FREE_MB="$(df -Pm "$APP_ROOT" | awk 'NR==2 {print $4}')"
if [ "$FREE_MB" -lt "$MIN_FREE_MB" ]; then
  echo "HOLD: insufficient free disk space under $APP_ROOT. Required ${MIN_FREE_MB}MB, found ${FREE_MB}MB."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing environment file: $ENV_FILE"
  exit 1
fi

if grep -q "^NEXT_PUBLIC_SUPABASE_URL=$" "$ENV_FILE" || \
   grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY=$" "$ENV_FILE" || \
   grep -q "^SUPABASE_SERVICE_ROLE_KEY=$" "$ENV_FILE"; then
  echo "Missing Supabase values in $ENV_FILE"
  echo "Edit secrets first, then rerun."
  exit 1
fi

if ss -ltn "sport = :$PREFLIGHT_PORT" | grep -q ":$PREFLIGHT_PORT"; then
  echo "HOLD: preflight port $PREFLIGHT_PORT is already in use."
  exit 1
fi

if [ -L "$APP_ROOT/current" ]; then
  PREVIOUS_CURRENT="$(readlink -f "$APP_ROOT/current")"
fi

echo "== Harbourview safer release deploy started =="
echo "Previous current release: ${PREVIOUS_CURRENT:-none}"

echo "== Validating Caddy configuration =="
caddy validate --config /etc/caddy/Caddyfile

echo "== Checking Caddy service health =="
systemctl is-active --quiet caddy

echo "== Creating source release =="
TMP_SOURCE_DIR="$RELEASES_DIR/.tmp-source-$(date +%Y%m%d-%H%M%S)-$$"
sudo -u "$APP_USER" git clone "$REPO_URL" "$TMP_SOURCE_DIR"
cd "$TMP_SOURCE_DIR"
sudo -u "$APP_USER" git checkout "$BRANCH"
GIT_SHA="$(sudo -u "$APP_USER" git rev-parse --short=7 HEAD)"
RELEASE_ID="release-$(date +%Y%m%d-%H%M%S)-$GIT_SHA"
SOURCE_DIR="$RELEASES_DIR/$RELEASE_ID-source"
RUNTIME_DIR="$RELEASES_DIR/$RELEASE_ID-runtime"
sudo -u "$APP_USER" mv "$TMP_SOURCE_DIR" "$SOURCE_DIR"
cd "$SOURCE_DIR"

echo "Release: $RELEASE_ID"

echo "== Installing dependencies =="
sudo -u "$APP_USER" npm ci

echo "== Running pre-build verification =="
sudo -u "$APP_USER" npm run typecheck
sudo -u "$APP_USER" npm run test:visibility
sudo -u "$APP_USER" npm run test:regulatory-signals-public-leakage

echo "== Building standalone Next.js runtime =="
sudo -u "$APP_USER" npm run build

echo "== Packaging runtime bundle =="
sudo -u "$APP_USER" mkdir -p "$RUNTIME_DIR"
sudo -u "$APP_USER" cp -R .next/standalone/* "$RUNTIME_DIR/"
sudo -u "$APP_USER" mkdir -p "$RUNTIME_DIR/.next"
sudo -u "$APP_USER" cp -R .next/static "$RUNTIME_DIR/.next/static"
sudo -u "$APP_USER" cp -R public "$RUNTIME_DIR/public"
if [ ! -f "$RUNTIME_DIR/server.js" ]; then
  echo "HOLD: packaged runtime missing server.js"
  exit 1
fi

echo "== Starting temporary preflight runtime on port $PREFLIGHT_PORT =="
cd "$RUNTIME_DIR"
sudo -u "$APP_USER" env PORT="$PREFLIGHT_PORT" NODE_ENV=production node server.js > "$LOG_DIR/preflight-$RELEASE_ID.log" 2>&1 &
PREFLIGHT_PID=$!

for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT/" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$PREFLIGHT_PID" >/dev/null 2>&1; then
    echo "HOLD: preflight runtime exited early."
    tail -n 100 "$LOG_DIR/preflight-$RELEASE_ID.log" || true
    exit 1
  fi
  sleep 1
  if [ "$i" = "30" ]; then
    echo "HOLD: preflight runtime did not become ready."
    tail -n 100 "$LOG_DIR/preflight-$RELEASE_ID.log" || true
    exit 1
  fi
done

echo "== Running temporary-port preflight route checks =="
for route in "/" "/marketplace" "/signals" "/intelligence" "/contact" "/intake"; do
  curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT$route" >/dev/null
  echo "PASS preflight $route"
done

ADMIN_STATUS="$(curl -s -o /tmp/harbourview-admin-check.html -w "%{http_code}" "http://127.0.0.1:$PREFLIGHT_PORT/admin")"
echo "Anonymous /admin status on preflight: $ADMIN_STATUS"

if [ "$ADMIN_STATUS" = "200" ]; then
  echo "HOLD: anonymous /admin returned 200 during preflight"
  exit 1
fi

cleanup_preflight

echo "== Switching current symlink =="
ln -sfn "$RUNTIME_DIR" "$APP_ROOT/current"
chown -h "$APP_USER:$APP_USER" "$APP_ROOT/current"
ACTIVATED="1"

echo "== Persisting deployment metadata =="
cat > "$METADATA_DIR/latest-deploy.env" <<EOF
RELEASE_ID=$RELEASE_ID
CURRENT_RUNTIME=$RUNTIME_DIR
PREVIOUS_RUNTIME=${PREVIOUS_CURRENT:-}
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DOMAIN=$DOMAIN
EOF

chown "$APP_USER:$APP_USER" "$METADATA_DIR/latest-deploy.env"
chmod 600 "$METADATA_DIR/latest-deploy.env"

echo "== Restarting Harbourview systemd service =="
systemctl restart harbourview

for i in {1..20}; do
  if systemctl is-active --quiet harbourview && curl -fsS "http://127.0.0.1:$APP_PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" = "20" ]; then
    echo "HOLD: harbourview systemd service did not become healthy after activation"
    journalctl -u harbourview -n 100 --no-pager || true
    exit 1
  fi
done

echo "== Verifying local active runtime routes =="
for route in "/" "/marketplace" "/signals" "/intelligence" "/contact" "/intake"; do
  curl -fsS "http://127.0.0.1:$APP_PORT$route" >/dev/null
  echo "PASS active local $route"
done

echo "== Verifying public HTTPS availability =="
for i in {1..10}; do
  if curl -fsSI "https://$DOMAIN/" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" = "10" ]; then
    echo "HOLD: public HTTPS did not respond successfully for https://$DOMAIN/"
    exit 1
  fi
done

echo "== Verifying public anonymous /admin denial =="
PUBLIC_ADMIN_STATUS="$(curl -s -o /tmp/harbourview-public-admin-check.html -w "%{http_code}" "https://$DOMAIN/admin")"
echo "Public anonymous /admin status: $PUBLIC_ADMIN_STATUS"

if [ "$PUBLIC_ADMIN_STATUS" = "200" ]; then
  echo "HOLD: public anonymous /admin returned 200 after activation"
  exit 1
fi

echo "== Running production leakage probe =="
cd "$SOURCE_DIR"
sudo -u "$APP_USER" env HARBOURVIEW_PUBLIC_BASE_URL="https://$DOMAIN" npm run probe:production-visibility

echo "== Release retention check =="
mapfile -t OLD_RUNTIMES < <(find "$RELEASES_DIR" -maxdepth 1 -type d -name 'release-*-runtime' | sort -r | tail -n +$((KEEP_RUNTIME_RELEASES + 1)))
if [ "${#OLD_RUNTIMES[@]}" -gt 0 ]; then
  echo "Older runtime releases eligible for manual cleanup:"
  printf '  %s\n' "${OLD_RUNTIMES[@]}"
else
  echo "No old runtime releases exceed retention window."
fi

echo "== Release retention summary =="
echo "Current release: $RUNTIME_DIR"
echo "Previous release retained: ${PREVIOUS_CURRENT:-none}"

echo "== Rollback metadata file =="
echo "$METADATA_DIR/latest-deploy.env"

echo "== Rollback command =="
if [ -n "$PREVIOUS_CURRENT" ]; then
  echo "sudo ln -sfn \"$PREVIOUS_CURRENT\" \"$APP_ROOT/current\" && sudo systemctl restart harbourview"
else
  echo "No previous release exists yet. Rollback requires restoring prior platform/DNS target."
fi

echo "== Deployment completed successfully =="
echo "GO if all verification checks above passed."
