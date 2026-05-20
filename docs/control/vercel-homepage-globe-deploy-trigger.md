# Vercel Homepage Globe Deployment Trigger

Date: 2026-05-20

## Objective

Open a deploy-allowlisted pull request after the globe same-screen router homepage was merged to main while the public Vercel URL still showed the previous landing page.

## Evidence inspected

- app/page.tsx on main renders GlobeSameScreenRouterLanding.
- components/globe/GlobeSameScreenRouterLanding.tsx contains the new country-first full-screen globe/router landing.
- vercel.json has git.deploymentEnabled set to false, so normal Git-connected automatic Vercel deployment is not guaranteed from main alone.
- scripts/vercel-ignore-wbcc-only.sh explicitly allows preview/* and deploy/* branches while skipping ordinary feature branches.

## Deployment intent

This PR makes no runtime product change. It exists to create an allowlisted deploy/* branch event and reviewable PR so the merged homepage can be deployed and verified against the public Vercel surface.

## Verification after deployment

- Page title and metadata should match Harbourview | Start by Country.
- Homepage should render the full-screen globe/router interface.
- Public/private leakage probes should remain clean.
- npm run typecheck and npm run test:globe-router should remain green.
