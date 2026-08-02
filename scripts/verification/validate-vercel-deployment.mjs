#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const token = process.env.VERCEL_TOKEN;
const deploymentUrl = process.env.DEPLOYMENT_URL;
const commitSha = process.env.COMMIT_SHA;
const expectedProjectId = process.env.VERCEL_PROJECT_ID;
const expectedTeamId = process.env.VERCEL_TEAM_ID;
const outputPath = process.env.VERCEL_VALIDATION_OUTPUT || 'release-evidence/vercel-deployment-validation.json';

for (const [name, value] of Object.entries({ VERCEL_TOKEN: token, DEPLOYMENT_URL: deploymentUrl, COMMIT_SHA: commitSha, VERCEL_PROJECT_ID: expectedProjectId, VERCEL_TEAM_ID: expectedTeamId })) {
  if (!value) throw new Error(`${name} is required`);
}
if (!/^[0-9a-f]{40}$/.test(commitSha)) throw new Error('COMMIT_SHA must be 40 lowercase hexadecimal characters');
if (/[\u0000-\u001f\u007f]/.test(deploymentUrl)) throw new Error('DEPLOYMENT_URL contains control characters');

const url = new URL(deploymentUrl);
if (
  url.protocol !== 'https:' ||
  !/^[a-z0-9-]+\.vercel\.app$/.test(url.hostname) ||
  url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash
) {
  throw new Error('DEPLOYMENT_URL must be an immutable root HTTPS *.vercel.app URL without credentials, port, query, or fragment');
}
const normalizedDeploymentUrl = `https://${url.hostname}/`;

const endpoint = new URL(`https://api.vercel.com/v13/deployments/${encodeURIComponent(url.hostname)}`);
endpoint.searchParams.set('teamId', expectedTeamId);
const response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } });
if (!response.ok) throw new Error(`Vercel API returned HTTP ${response.status}`);
const deployment = await response.json();

const actualProjectId = deployment.projectId || deployment.project?.id || null;
const actualTeamId = deployment.team?.id || deployment.teamId || deployment.ownerId || null;
const actualState = deployment.readyState || deployment.state || null;
const actualCommitSha = deployment.meta?.githubCommitSha || deployment.meta?.gitCommitSha || deployment.gitSource?.sha || null;
const canonicalDeploymentHost = deployment.url || null;

const checks = {
  projectId: actualProjectId === expectedProjectId,
  teamId: actualTeamId === expectedTeamId,
  ready: actualState === 'READY',
  commitSha: actualCommitSha === commitSha,
  canonicalHost: canonicalDeploymentHost === url.hostname,
};

const report = {
  generatedAt: new Date().toISOString(),
  normalizedDeploymentUrl,
  expected: { projectId: expectedProjectId, teamId: expectedTeamId, commitSha, state: 'READY', host: url.hostname },
  actual: { projectId: actualProjectId, teamId: actualTeamId, commitSha: actualCommitSha, state: actualState, host: canonicalDeploymentHost, deploymentId: deployment.id || null },
  checks,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ normalizedDeploymentUrl, checks }, null, 2));
if (Object.values(checks).some((value) => !value)) process.exitCode = 2;
