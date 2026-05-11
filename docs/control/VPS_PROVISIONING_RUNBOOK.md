# Harbourview VPS Provisioning Runbook

## Scope
This runbook provisions Harbourview for self-hosted deployment on Ubuntu 24.04 using:
- Node.js 22
- standalone Next.js output
- Caddy HTTPS reverse proxy
- systemd service management
- rollback-safe release directories

This runbook does not modify:
- app routes
- marketplace behavior
- UI
- Supabase schema
- auth logic

## Required Inputs
Before deployment:
- Hetzner VPS provisioned
- Ubuntu 24.04 installed
- SSH key configured
- staging.harbourview.co DNS A record pointed at VPS
- Supabase environment values available

## Files Added
- scripts/self-host/provision-harbourview-server.sh
- scripts/self-host/first-deploy-harbourview.sh

## Provisioning Sequence
SSH into the VPS as root.

Copy the provisioning script to the server.

Run:

```bash
chmod +x provision-harbourview-server.sh
sudo ./provision-harbourview-server.sh
```

This script:
- updates Ubuntu
- installs Node.js 22
- installs Caddy
- installs git and rsync
- configures UFW firewall
- creates harbourview user
- creates /opt/harbourview structure
- installs systemd service
- configures Caddy for staging.harbourview.co
- stops before secrets are inserted

## Secrets Step
Edit:

```bash
nano /opt/harbourview/shared/.env.production
```

Insert:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Do not continue until all values are populated.

## First Deployment
Run:

```bash
chmod +x first-deploy-harbourview.sh
sudo ./first-deploy-harbourview.sh
```

This script:
- clones branch deploy/self-host-portability
- installs dependencies
- runs typecheck
- runs leakage checks
- builds standalone Next.js runtime
- switches release symlink
- restarts systemd service
- verifies route availability
- verifies anonymous /admin denial
- runs production leakage probe against staging URL
- rolls back automatically if verification fails

## Rollback Logic
The deploy script preserves the previous current symlink.

If deployment fails:
- previous release symlink is restored
- harbourview service is restarted

Manual rollback:

```bash
ln -sfn <previous-release-path> /opt/harbourview/current
systemctl restart harbourview
```

## Verification Requirements
Required successful checks:
- / returns 200
- /marketplace returns 200
- /signals returns 200
- /intelligence returns 200
- /contact returns 200
- /intake returns 200
- /admin does not return 200 anonymously
- production leakage probe passes

## DNS Cutover Rule
Do not move production DNS until:
- staging verification passes
- leakage checks are zero
- anonymous admin denial passes
- rollback path is confirmed

## Production Promotion
After staging passes:
- update HARBOURVIEW_PUBLIC_BASE_URL
- replace staging domain in Caddyfile
- reload Caddy
- repoint production DNS
- rerun leakage verification
