#!/usr/bin/env bash
set -euo pipefail

DOMAIN="staging.harbourview.co"
APP_USER="harbourview"
APP_ROOT="/opt/harbourview"
APP_PORT="3000"

echo "== Harbourview VPS provisioning started =="

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root."
  exit 1
fi

echo "== Updating system =="
apt update
apt upgrade -y
apt install -y curl git rsync unzip ca-certificates gnupg ufw debian-keyring debian-archive-keyring apt-transport-https

echo "== Installing Node.js 22 from NodeSource =="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

echo "Node version:"
node -v
echo "npm version:"
npm -v

echo "== Installing Caddy =="
install -d -m 0755 /etc/apt/keyrings
curl -fsSL "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -fsSL "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" > /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

echo "== Creating app user =="
if ! id "$APP_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$APP_USER"
fi

usermod -aG sudo "$APP_USER"

echo "== Creating Harbourview directory structure =="
mkdir -p "$APP_ROOT/releases"
mkdir -p "$APP_ROOT/shared"
mkdir -p "$APP_ROOT/backups"
chown -R "$APP_USER:$APP_USER" "$APP_ROOT"

echo "== Creating placeholder environment file =="
cat > "$APP_ROOT/shared/.env.production" <<EOF
NODE_ENV=production
PORT=$APP_PORT

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

HARBOURVIEW_PUBLIC_BASE_URL=https://$DOMAIN
EOF

chown "$APP_USER:$APP_USER" "$APP_ROOT/shared/.env.production"
chmod 600 "$APP_ROOT/shared/.env.production"

echo "== Installing systemd service =="
cat > /etc/systemd/system/harbourview.service <<EOF
[Unit]
Description=Harbourview Next.js Application
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_ROOT/current
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
EnvironmentFile=$APP_ROOT/shared/.env.production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable harbourview

echo "== Configuring Caddy for staging =="
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
    encode gzip zstd

    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
    }

    reverse_proxy 127.0.0.1:$APP_PORT
}
EOF

caddy validate --config /etc/caddy/Caddyfile
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

echo "== Configuring UFW firewall =="
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

echo "== Provisioning complete =="
echo "STOPPING BEFORE SECRETS."
echo ""
echo "Next required manual step:"
echo "Edit $APP_ROOT/shared/.env.production and insert Supabase values."
echo ""
echo "Run:"
echo "  nano $APP_ROOT/shared/.env.production"
echo ""
echo "Then run the first deploy script."
