# Harbourview Self-Host Runbook

## Objective
Run Harbourview independently of Vercel/Netlify using a VPS with Node.js 22, standalone Next.js output, Caddy HTTPS and systemd.

## Recommended VPS
- Hetzner CX22 or equivalent
- Ubuntu 24.04 LTS
- Minimum 2 vCPU / 4GB RAM

## Required Packages
- Node.js 22
- Caddy
- git
- rsync

## Deployment Layout
- /opt/harbourview/current
- /opt/harbourview/shared/.env.production
- /var/log/caddy/

## Initial Provisioning
1. Create harbourview user.
2. Install Node.js 22.
3. Install Caddy.
4. Copy deploy/systemd/harbourview.service to /etc/systemd/system/.
5. Copy deploy/caddy/Caddyfile.example into active Caddy config.
6. Populate .env.production.
7. Enable and start harbourview service.
8. Reload Caddy.

## Verification
Run:
- npm run typecheck
- npm run build
- npm run test:visibility
- npm run test:regulatory-signals-public-leakage
- npm run probe:production-visibility

## Rollback
1. Stop current service.
2. Restore previous release directory.
3. Restart harbourview service.
4. Re-run leakage verification.

## DNS Cutover Rule
Do not move production DNS until:
- anonymous /admin denial passes
- forbidden leakage strings are zero
- marketplace routes render successfully
- contact/intake routes function
- production probe passes
