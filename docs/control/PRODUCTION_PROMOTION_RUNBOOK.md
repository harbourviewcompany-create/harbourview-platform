# Harbourview Production Promotion Runbook

## Objective
Promote Harbourview from self-hosted staging to production without relying on Vercel or Netlify build previews.

The production model uses:
- Next.js standalone output
- Node.js 22
- Caddy HTTPS reverse proxy
- systemd process management
- symlink-based release activation
- rollback-safe release retention

## Deployment Layout

```text
/opt/harbourview/
  current -> /opt/harbourview/releases/<active-release-runtime>
  releases/
  shared/
    .env.production
  backups/
  logs/
```

## Release Versioning
Release IDs use timestamp plus git short SHA:

```text
release-YYYYMMDD-HHMMSS-<git-sha7>
```

Example:

```text
release-20260509-143000-0baaae1
```

## Promotion Strategy
Use symlink-based deployment first. Full blue/green can be added later if Harbourview traffic or uptime requirements justify separate live pools.

Required promotion sequence:
1. Clone branch into isolated release source directory.
2. Install dependencies with npm ci.
3. Run typecheck and leakage tests before build.
4. Build standalone Next.js runtime.
5. Package runtime into isolated release runtime directory.
6. Start packaged runtime on temporary preflight port.
7. Verify critical routes against temporary port.
8. Verify anonymous /admin does not return 200.
9. Stop temporary preflight runtime.
10. Switch /opt/harbourview/current symlink.
11. Restart harbourview systemd service.
12. Verify systemd and Caddy health.
13. Verify public HTTPS route checks.
14. Run production leakage probe against the target URL.
15. Retain previous release for rollback.

## Promotion Gates
Do not promote unless all pass:
- npm ci
- npm run typecheck
- npm run test:visibility
- npm run test:regulatory-signals-public-leakage
- npm run build
- temporary-port preflight route checks
- anonymous /admin non-200 on preflight
- systemd service active after restart
- Caddy config valid
- public HTTPS route checks
- production leakage probe with HARBOURVIEW_PUBLIC_BASE_URL set to the target URL

## Critical Routes
Public routes expected to return 200:
- /
- /marketplace
- /signals
- /intelligence
- /contact
- /intake

Admin route expected not to return anonymous 200:
- /admin

## Rollback
The deploy script records the previous /opt/harbourview/current target before activation.

Manual rollback:

```bash
sudo ln -sfn <previous-release-runtime> /opt/harbourview/current
sudo systemctl restart harbourview
curl -I http://127.0.0.1:3000
HARBOURVIEW_PUBLIC_BASE_URL=https://<target-domain> npm run probe:production-visibility
```

If DNS was already cut over and the VPS fails hard:
1. Repoint DNS to the previous Vercel target if it remains available.
2. Keep DNS TTL at 300 during migration window.
3. Keep Vercel untouched for 7 to 14 days after self-host cutover.

## Release Retention
Default policy:
- keep latest active release
- keep previous 5 runtime releases
- do not automatically remove source directories until production has passed burn-in

After rollback drills pass, cleanup can remove older release directories manually.

## Backup Retention
Harbourview app deployment does not own Supabase backups. Supabase backup policy must remain separate.

Server-side retention:
- retain last 5 runtime releases
- retain deployment logs for 14 days
- retain Caddy logs for 30 days
- retain environment file backup before edits

## Log Rotation
Recommended logrotate file:

```text
/var/log/caddy/harbourview*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    sharedscripts
    postrotate
        systemctl reload caddy >/dev/null 2>&1 || true
    endscript
}
```

## Uptime Monitoring
Minimum external checks:
- https://harbourview.co/
- https://harbourview.co/marketplace
- https://harbourview.co/admin expecting non-200 or auth denial

Recommended services:
- UptimeRobot
- Better Stack
- Hetzner Cloud metrics

## Automatic Restart
systemd must keep:

```ini
Restart=always
RestartSec=10
TimeoutStopSec=30
KillSignal=SIGTERM
```

Add stronger systemd sandboxing only after the self-hosted runtime is proven stable.

## SSL Renewal Verification
Caddy manages automatic HTTPS. During the first week after cutover, verify:

```bash
curl -Iv https://harbourview.co
sudo journalctl -u caddy -n 100 --no-pager
sudo systemctl status caddy
```

## Hardened Production Checklist
Before migrating off https://harbourview.vercel.app permanently:
- staging deployment passed
- production deployment passed
- production leakage probe passed
- anonymous /admin denied
- Caddy config validated
- systemd service active
- rollback command printed and tested
- previous release retained
- DNS TTL lowered to 300 before cutover
- Vercel retained as hot standby for 7 to 14 days
- external uptime monitor active
- Supabase env values verified
- no secrets committed
- logs readable
- SSL active

## GO/HOLD Standard
GO only if route checks, admin denial, leakage probe, Caddy validation and systemd health all pass.

HOLD if any public route fails, /admin returns anonymous 200, leakage probe fails, Caddy config is invalid or systemd fails to restart cleanly.
