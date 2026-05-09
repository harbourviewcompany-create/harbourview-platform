#!/usr/bin/env bash
set -euo pipefail

APP_USER="harbourview"
APP_ROOT="/opt/harbourview"
REPO_URL="https://github.com/harbourviewcompany-create/harbourview-platform.git"
BRANCH="deploy/self-host-portability"
DOMAIN="staging.harbourview.co"
RELEASE_ID="release-$(date +%Y%m%d-%H%M%S)"
SOURCE_DIR="$APP_ROOT/releases/$RELEASE_ID-source"
RUNTIME_DIR="$APP_ROOT/releases/$RELEASE_ID-runtime"
PREVIOUS_CURRENT=""

echo "== Harbourview first deploy started =="
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
ENV_FILE="$APP_ROOT/shared/.env.production"

if grep -q "^NEXT_PUBLIC_SUPABASE_URL=$" "$ENV_FILE" || \
   grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY=$" "$ENV_FILE" || \
   grep -q "^SUPABASE_SERVICE_ROLE_KEY=$" "$ENV_FILE"; then
  echo "Missing Supabase values in $ENV_FILE"
  echo "Edit secrets first, then rerun."
  exit 1
fi

echo "== Cloning Harbourview repo =="
sudo -u "$APP_USER" git clone "$REPO_URL" "$SOURCE_DIR"
cd "$SOURCE_DIR"
sudo -u "$APP_USER" git checkout "$BRANCH"

echo "== Installing dependencies =="
sudo -u "$APP_USER" npm ci

echo "== Running pre-build verification =="
sudo -u "$APP_USER" npm run typecheck
sudo -u "$APP_USER" npm run test:visibility
sudo -u "$APP_USER" npm run test:regulatory-signals-public-leakage || {
  echo "Regulatory signals leakage test failed."
  exit 1
}

echo "== Building standalone Next.js app =="
sudo -u "$APP_USER" npm run build

echo "== Packaging runtime bundle =="
sudo -u "$APP_USER" mkdir -p "$RUNTIME_DIR"
sudo -u "$APP_USER" cp -R .next/standalone/* "$RUNTIME_DIR/"
sudo -u "$APP_USER" mkdir -p "$RUNTIME_DIR/.next"
sudo -u "$APP_USER" cp -R .next/static "$RUNTIME_DIR/.next/static"
sudo -u "$APP_USER" cp -R public "$RUNTIME_DIR/public"

echo "== Switching current symlink =="
ln -sfn "$RUNTIME_DIR" "$APP_ROOT/current"
chown -h "$APP_USER:$APP_USER" "$APP_ROOT/current"

echo "== Restarting Harbourview service =="
systemctl restart harbourview
sleep 5

echo "== Checking service status =="
if ! systemctl is-active --quiet harbourview; then
  echo "Harbourview service failed to start."

  if [ -n "$PREVIOUS_CURRENT" ]; then
    echo "Rolling back symlink to $PREVIOUS_CURRENT"
    ln -sfn "$PREVIOUS_CURRENT" "$APP_ROOT/current"
    systemctl restart harbourview
  fi

  journalctl -u harbourview -n 100 --no-pager
  exit 1
fi

echo "== Local HTTP verification =="
curl -fsS "http://127.0.0.1:3000/" >/dev/null
curl -fsS "http://127.0.0.1:3000/marketplace" >/dev/null
curl -fsS "http://127.0.0.1:3000/signals" >/dev/null
curl -fsS "http://127.0.0.1:3000/intelligence" >/dev/null
curl -fsS "http://127.0.0.1:3000/contact" >/dev/null
curl -fsS "http://127.0.0.1:3000/intake" >/dev/null

ADMIN_STATUS="$(curl -s -o /tmp/harbourview-admin-check.html -w "%{http_code}" "http://127.0.0.1:3000/admin")"
echo "Anonymous /admin status: $ADMIN_STATUS"

if [ "$ADMIN_STATUS" = "200" ]; then
  echo "HOLD: /admin returned 200 anonymously."
  if [ -n "$PREVIOUS_CURRENT" ]; then
    echo "Rolling back due to admin exposure."
    ln -sfn "$PREVIOUS_CURRENT" "$APP_ROOT/current"
    systemctl restart harbourview
  fi
  exit 1
fi

echo "== Public HTTPS verification =="
curl -I "https://$DOMAIN/" || {
  echo "Public HTTPS check failed. Confirm DNS A record points to this VPS and Caddy has issued cert."
  exit 1
}

echo "== Production leakage probe against staging URL =="
cd "$SOURCE_DIR"
sudo -u "$APP_USER" env HARBOURVIEW_PUBLIC_BASE_URL="https://$DOMAIN" npm run probe:production-visibility || {
  echo "HOLD: leakage probe failed."

  if [ -n "$PREVIOUS_CURRENT" ]; then
    echo "Rolling back due to leakage failure."
    ln -sfn "$PREVIOUS_CURRENT" "$APP_ROOT/current"
    systemctl restart harbourview
  fi

  exit 1
}

echo "== Deployment complete =="
echo "GO for staging if all checks above passed."
echo "Current release: $RUNTIME_DIR"
echo "Previous release: ${PREVIOUS_CURRENT:-none}"
echo ""
echo "Rollback command if needed:"
echo "  ln -sfn \"$PREVIOUS_CURRENT\" \"$APP_ROOT/current\" && systemctl restart harbourview"
