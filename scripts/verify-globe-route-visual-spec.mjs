import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = cleanBaseUrl(process.env.BASE_URL || 'http://127.0.0.1:3000');
const artifactDir = process.env.ARTIFACT_DIR || 'verification-results/globe-route-visual-spec';
const screenshotDir = path.join(artifactDir, 'screenshots');

const states = [
  { key: 'default', route: '/', query: '' },
  { key: 'selected-market', route: '/', query: '?market=germany' },
  { key: 'role-sheet', route: '/', query: '?role=buyer' },
  { key: 'intent-sheet', route: '/', query: '?intent=find-supply' },
  { key: 'multi-market', route: '/', query: '?markets=germany,portugal,uk' },
  { key: 'fallback', route: '/', query: '?route=fallback' },
];

const viewports = [
  { key: 'desktop', width: 1440, height: 900 },
  { key: 'mobile', width: 390, height: 844 },
];

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const report = {
  generatedAt: new Date().toISOString(),
  runId,
  baseUrl,
  artifactDir,
  screenshots: [],
};

const { chromium } = await loadPlaywright();
await fs.mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: 'en-US' });

try {
  for (const state of states) {
    const url = buildUrl(baseUrl, state.route, state.query);

    for (const viewport of viewports) {
      const page = await context.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      const status = response?.status() ?? 0;
      if (status !== 200) {
        throw new Error(`Expected 200 for ${state.key} (${viewport.key}) at ${url}; received ${status}`);
      }

      const fileName = `${state.key}__${viewport.key}.png`;
      const outputPath = path.join(screenshotDir, fileName);
      await page.screenshot({ path: outputPath, fullPage: true });

      report.screenshots.push({
        state: state.key,
        viewport: viewport.key,
        width: viewport.width,
        height: viewport.height,
        url,
        outputPath,
      });

      console.log(`[capture] ${state.key} ${viewport.key} -> ${outputPath}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const reportJsonPath = path.join(artifactDir, 'globe-route-visual-spec.json');
const reportMdPath = path.join(artifactDir, 'globe-route-visual-spec.md');
await fs.writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(reportMdPath, renderMarkdown(report), 'utf8');

console.log('Generated artifacts:');
console.log(`- ${reportJsonPath}`);
console.log(`- ${reportMdPath}`);
for (const item of report.screenshots) console.log(`- ${item.outputPath}`);

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    throw new Error(
      `Playwright is required for visual capture. Run via npx -y -p playwright node scripts/verify-globe-route-visual-spec.mjs, or install playwright in the runner. ${error instanceof Error ? error.message : ''}`,
    );
  }
}

function cleanBaseUrl(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildUrl(base, route, query) {
  const url = new URL(route, `${base}/`);
  if (query?.startsWith('?')) url.search = query;
  return url.toString();
}

function renderMarkdown(data) {
  const lines = [];
  lines.push('# Globe route visual spec artifacts');
  lines.push('');
  lines.push(`- Generated at: ${data.generatedAt}`);
  lines.push(`- Base URL: ${data.baseUrl}`);
  lines.push(`- Run ID: ${data.runId}`);
  lines.push('');
  lines.push('| State | Viewport | URL | Screenshot |');
  lines.push('| --- | --- | --- | --- |');
  for (const shot of data.screenshots) {
    lines.push(`| ${shot.state} | ${shot.viewport} (${shot.width}x${shot.height}) | ${shot.url} | ${shot.outputPath} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}
