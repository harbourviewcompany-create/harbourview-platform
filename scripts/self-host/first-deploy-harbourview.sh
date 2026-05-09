#!/usr/bin/env bash
set -euo pipefail

APP_USER="harbourview"
APP_ROOT="/opt/harbourview"
REPO_URL="https://github.com/harbourviewcompany-create/harbourview-platform.git"
BRANCH="deploy/self-host-portability"
DOMAIN="staging.harbourview.co"
APP_PORT="3000"
PREFLIGHT_PORT="3001"
SHORT_SHA="$(date +%s)"
RELEASE_ID="release-$(date +%Y%m%d-%H%M%S)-${SHORT_SHA: -7}"
SOURCE_DIR="$APP_ROOT/releases/$RELEASE_ID-source"
RUNTIME_DIR="$APP_ROOT/releases/$RELEASE_ID-runtime"
PREVIOUS_CURRENT=""
PREFLIGHT_PID=""
ENV_FILE="$APP_ROOT/shared/.env.production"

rollback() {
  if [ -n "$PREFLIGHT_PID" ]; then
    kill "$PREFLIGHT_PID" >/dev/null 2>&1 || true
  fi

  if [ -n "$PREVIOUS_CURRENT" ]; then
    echo "Rolling back to previous release: $PREVIOUS_CURRENT"
    ln -sfn "$PREVIOUS_CURRENT" "$APP_ROOT/current"
    systemctl restart harbourview || true
  fi
}

trap rollback ERR

echo "== Harbourview safer release deploy started =="
echo "Release: $RELEASE_ID"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root."
  exit 1
fi

if [ -L "$APP_ROOT/current" ]; then
  PREVIOUS_CURRENT="$(readlink -f "$APP_ROOT/current")"
  echo "Previous current release: $PREVIOUS_CURRENT"
else
  echo "No previous release symlink found."
fi

echo "== Checking secrets are populated =="

if grep -q "^NEXT_PUBLIC_SUPABASE_URL=$" "$ENV_FILE" || \
   grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY=$" "$ENV_FILE" || \
   grep -q "^SUPABASE_SERVICE_ROLE_KEY=$" "$ENV_FILE"; then
  echo "Missing Supabase values in $ENV_FILE"
  echo "Edit secrets first, then rerun."
  exit 1
fi

echo "== Validating Caddy configuration =="
caddy validate --config /etc/caddy/Caddyfile

echo "== Checking systemd health =="
systemctl status caddy --no-pager >/dev/null

echo "== Cloning Harbourview repo =="
sudo -u "$APP_USER" git clone "$REPO_URL" "$SOURCE_DIR"
cd "$SOURCE_DIR"
sudo -u "$APP_USER" git checkout "$BRANCH"

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

echo "== Starting temporary preflight runtime =="
cd "$RUNTIME_DIR"
sudo -u "$APP_USER" env PORT="$PREFLIGHT_PORT" NODE_ENV=production node server.js > "$APP_ROOT/logs/preflight-$RELEASE_ID.log" 2>&1 &
PREFLIGHT_PID=$!

sleep 10

echo "== Running temporary-port preflight checks =="
curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT/" >/dev/null
curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT/marketplace" >/dev/null
curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT/signals" >/dev/null
curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT/intelligence" >/dev/null
curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT/contact" >/dev/null
curl -fsS "http://127.0.0.1:$PREFLIGHT_PORT/intake" >/dev/null

ADMIN_STATUS="$(curl -s -o /tmp/harbourview-admin-check.html -w "%{http_code}" "http://127.0.0.1:$PREFLIGHT_PORT/admin")"
echo "Anonymous /admin status on preflight: $ADMIN_STATUS"

if [ "$ADMIN_STATUS" = "200" ]; then
  echo "HOLD: anonymous /admin returned 200 during preflight"
  exit 1
fi

echo "== Stopping temporary preflight runtime =="
kill "$PREFLIGHT_PID"
PREFLIGHT_PID=""

echo "== Switching current symlink =="
ln -sfn "$RUNTIME_DIR" "$APP_ROOT/current"
chown -h "$APP_USER:$APP_USER" "$APP_ROOT/current"

echo "== Restarting Harbourview systemd service =="
systemctl restart harbourview
sleep 5

if ! systemctl is-active --quiet harbourview; then
  echo "HOLD: harbourview systemd service failed after activation"
  journalctl -u harbourview -n 100 --no-pager
  exit 1
fi

echo "== Verifying public HTTPS availability =="
curl -I "https://$DOMAIN/"

echo "== Running production leakage probe =="
cd "$SOURCE_DIR"
sudo -u "$APP_USER" env HARBOURVIEW_PUBLIC_BASE_URL="https://$DOMAIN" npm run probe:production-visibility

echo "== Release retention summary =="
echo "Current release: $RUNTIME_DIR"
echo "Previous release retained: ${PREVIOUS_CURRENT:-none}"

echo "== Rollback command =="
echo "sudo ln -sfn \"$PREVIOUS_CURRENT\" \"$APP_ROOT/current\" && sudo systemctl restart harbourview"

echo "== Deployment completed successfully =="
echo "GO if all verification checks above passed."
