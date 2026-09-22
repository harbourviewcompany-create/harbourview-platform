import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = path.resolve('scripts/check-project-registry-discipline.mjs');

function run({ login, headRef, body = '' }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-discipline-'));
  const eventPath = path.join(dir, 'event.json');
  fs.writeFileSync(eventPath, JSON.stringify({ pull_request: { body, user: { login }, head: { ref: headRef }, number: 9999 } }));
  return spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_EVENT_PATH: eventPath, GITHUB_REPOSITORY: 'harbourviewcompany-create/harbourview-platform', REGISTRY_DISCIPLINE_CHANGED_FILES: JSON.stringify(['package-lock.json']) },
  });
}

describe('project registry discipline', () => {
  it('accepts dependency-only Dependabot updates without PR-body registry metadata', () => {
    const result = run({ login: 'dependabot[bot]', headRef: 'dependabot/npm_and_yarn/example-1.2.3' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Dependabot dependency/workflow update has no project-registry impact');
  });

  it('still requires registry metadata for equivalent human-authored sensitive changes', () => {
    const result = run({ login: 'harbourviewcompany-create', headRef: 'fix/example' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('PR body does not include a `## Registry Impact` section');
  });
});