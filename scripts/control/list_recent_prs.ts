import { mkdir, writeFile } from 'node:fs/promises';

const HOURS_WINDOW = 24;
const PER_PAGE = 100;

type PullRequest = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  user: { login: string };
  head: { ref: string; sha: string };
  base: { ref: string };
  mergeable: boolean | null;
  labels?: Array<{ name: string }>;
};

type PrRecord = {
  number: number;
  title: string;
  url: string;
  branch: string;
  base: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  draft: boolean;
  mergeability: 'mergeable' | 'conflicting' | 'unknown';
  headSha: string;
  changedFilesCount: number;
  changedFiles: string[];
  checks: Array<{ name: string; status: string; conclusion: string | null; url: string }>;
  subsystem: string;
  riskTier: 'low' | 'medium' | 'high';
  preliminaryDecision: 'GO' | 'HOLD';
};

const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const token = process.env.GITHUB_TOKEN;

if (!owner || !repo) throw new Error('Missing GITHUB_REPOSITORY (expected owner/repo).');
if (!token) throw new Error('Missing GITHUB_TOKEN.');

const since = new Date(Date.now() - HOURS_WINDOW * 60 * 60 * 1000);

async function github<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'harbourview-pr-control-ledger',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} for ${path}: ${body.slice(0, 300)}`);
  }

  return (await res.json()) as T;
}

async function listRecentPrs(): Promise<PullRequest[]> {
  const collected: PullRequest[] = [];
  for (let page = 1; page <= 3; page += 1) {
    const pulls = await github<PullRequest[]>(`/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=${PER_PAGE}&page=${page}`);
    if (pulls.length === 0) break;

    for (const pr of pulls) {
      const updatedAt = new Date(pr.updated_at);
      if (updatedAt >= since) {
        collected.push(pr);
      }
    }

    const oldest = pulls.at(-1);
    if (oldest && new Date(oldest.updated_at) < since) break;
  }
  return collected;
}

async function listPrFiles(prNumber: number): Promise<string[]> {
  const files: string[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await github<Array<{ filename: string }>>(`/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`);
    if (batch.length === 0) break;
    files.push(...batch.map((f) => f.filename));
    if (batch.length < 100) break;
  }
  return files;
}

async function listChecks(sha: string) {
  const checkRuns = await github<{ check_runs: Array<{ name: string; status: string; conclusion: string | null; html_url: string }> }>(`/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`);
  return checkRuns.check_runs.map((check) => ({
    name: check.name,
    status: check.status,
    conclusion: check.conclusion,
    url: check.html_url,
  }));
}

function inferSubsystem(pr: PullRequest, files: string[]): string {
  const labels = new Set((pr.labels || []).map((l) => l.name.toLowerCase()));
  if ([...labels].find((name) => name.includes('workflow') || name.includes('ci'))) return 'ci/workflows';
  if (files.some((f) => f.startsWith('.github/workflows/'))) return 'ci/workflows';
  if (files.some((f) => f.startsWith('docs/control/'))) return 'control-docs';
  if (files.some((f) => f.startsWith('app/admin/'))) return 'admin-surface';
  if (files.some((f) => f.startsWith('scripts/'))) return 'verification-scripts';
  if (files.some((f) => f.startsWith('components/'))) return 'ui-components';
  return 'general';
}

function assessRisk(pr: PullRequest, files: string[], checks: Array<{ conclusion: string | null }>): 'low' | 'medium' | 'high' {
  if (pr.draft) return 'medium';
  const failedCheck = checks.some((c) => c.conclusion === 'failure' || c.conclusion === 'cancelled' || c.conclusion === 'timed_out');
  if (failedCheck) return 'high';
  const touchesHighRiskSurface = files.some((f) => f.startsWith('app/api/') || f.startsWith('.github/workflows/') || f.includes('auth') || f.includes('middleware'));
  if (touchesHighRiskSurface || files.length > 30) return 'high';
  if (files.length > 10) return 'medium';
  return 'low';
}

function decidePreliminary(pr: PullRequest, checks: Array<{ conclusion: string | null }>, risk: 'low' | 'medium' | 'high'): 'GO' | 'HOLD' {
  const failedCheck = checks.some((c) => c.conclusion === 'failure' || c.conclusion === 'cancelled' || c.conclusion === 'timed_out');
  if (pr.draft || risk === 'high' || failedCheck) return 'HOLD';
  return 'GO';
}

function mergeabilityState(mergeable: boolean | null): 'mergeable' | 'conflicting' | 'unknown' {
  if (mergeable === true) return 'mergeable';
  if (mergeable === false) return 'conflicting';
  return 'unknown';
}

function toMarkdown(rows: PrRecord[]): string {
  const lines = [
    '# PR Universe (last 24h)',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '| PR | Branch→Base | Author | Created | Updated | State | Mergeability | Files | Checks | Subsystem | Risk | Decision |',
    '|---|---|---|---|---|---|---|---:|---|---|---|---|',
  ];

  for (const row of rows) {
    const prCell = `[#${row.number}](${row.url}) ${row.title.replace(/\|/g, '\\|')}`;
    const checksCell = row.checks.length === 0 ? 'none' : row.checks.map((c) => `${c.name}:${c.conclusion ?? c.status}`).join('<br/>').replace(/\|/g, '\\|');
    const stateCell = `${row.state}${row.draft ? '/draft' : ''}`;
    lines.push(`| ${prCell} | ${row.branch}→${row.base} | ${row.author} | ${row.createdAt} | ${row.updatedAt} | ${stateCell} | ${row.mergeability} | ${row.changedFilesCount} | ${checksCell} | ${row.subsystem} | ${row.riskTier} | ${row.preliminaryDecision} |`);
    const filesCell = row.changedFiles.length === 0 ? 'none' : row.changedFiles.join('<br/>').replace(/\|/g, '\\|');
    lines.push(`| ↳ files | ${filesCell} |  |  |  |  |  |  |  |  |  |  |`);
  }

  if (rows.length === 0) {
    lines.push('| *(none)* | - | - | - | - | - | - | 0 | - | - | - | - |');
  }

  lines.push('');
  return lines.join('\n');
}

async function main() {
  const pulls = await listRecentPrs();

  const rows: PrRecord[] = [];
  for (const pr of pulls) {
    const [changedFiles, checks] = await Promise.all([listPrFiles(pr.number), listChecks(pr.head.sha)]);
    const subsystem = inferSubsystem(pr, changedFiles);
    const riskTier = assessRisk(pr, changedFiles, checks);
    const preliminaryDecision = decidePreliminary(pr, checks, riskTier);

    rows.push({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      branch: pr.head.ref,
      base: pr.base.ref,
      author: pr.user.login,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      state: pr.state,
      draft: pr.draft,
      mergeability: mergeabilityState(pr.mergeable),
      headSha: pr.head.sha,
      changedFilesCount: changedFiles.length,
      changedFiles,
      checks,
      subsystem,
      riskTier,
      preliminaryDecision,
    });
  }

  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/pr-universe.json', `${JSON.stringify({ windowHours: HOURS_WINDOW, generatedAt: new Date().toISOString(), count: rows.length, prs: rows }, null, 2)}\n`, 'utf8');
  await writeFile('artifacts/pr-universe.md', toMarkdown(rows), 'utf8');

  console.log(`PR universe artifacts written. count=${rows.length}`);
}

main().catch((err) => {
  console.error('Failed to build PR universe artifacts:', err instanceof Error ? err.message : err);
  process.exit(1);
});
