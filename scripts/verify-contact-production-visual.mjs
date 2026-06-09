import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.cwd(), '.tmp/contact-visual/node_modules/playwright'));

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const baseUrl = cleanBaseUrl(process.env.BASE_URL || 'https://harbourview.vercel.app');
const contactUrl = buildCacheBustedUrl('/contact');
const adminUrl = buildCacheBustedUrl('/admin');
const artifactDir = process.env.ARTIFACT_DIR || 'verification-results/contact-production-visual';
const screenshotDir = path.join(artifactDir, 'screenshots');

const forbiddenLeakageStrings = [
  'View source listing',
  'sourceUrl',
  'sourceName',
  'Evidence captured',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
];

const viewports = [
  { label: 'desktop-1440x900', width: 1440, height: 900, type: 'desktop' },
  { label: 'laptop-1366x768', width: 1366, height: 768, type: 'desktop' },
  { label: 'mobile-390x844', width: 390, height: 844, type: 'mobile' },
];

const report = {
  verdict: 'PENDING',
  generatedAt: new Date().toISOString(),
  runId,
  baseUrl,
  contactUrl,
  adminUrl,
  viewports: [],
  admin: null,
  failures: [],
};

await fs.mkdir(screenshotDir, { recursive: true });

const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: false,
  locale: 'en-US',
  ...(BYPASS_TOKEN ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': BYPASS_TOKEN } } : {}),
});

try {
  const adminResponse = await context.request.get(adminUrl, {
    maxRedirects: 0,
    headers: cacheBypassHeaders(),
  });

  report.admin = {
    url: adminUrl,
    status: adminResponse.status(),
    passed: adminResponse.status() === 401,
  };

  if (adminResponse.status() !== 401) {
    report.failures.push(`/admin expected 401 for anonymous access, received ${adminResponse.status()}`);
  }

  for (const viewport of viewports) {
    const page = await context.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    const viewportReport = {
      ...viewport,
      url: contactUrl,
      screenshots: {},
      checks: {},
      failures: [],
    };

    const response = await page.goto(contactUrl, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    const status = response?.status() || 0;
    viewportReport.status = status;
    if (status !== 200) viewportReport.failures.push(`/contact expected 200, received ${status}`);

    const topScreenshot = path.join(screenshotDir, `${viewport.label}-top.png`);
    await page.screenshot({ path: topScreenshot, fullPage: false });
    viewportReport.screenshots.top = topScreenshot;

    const html = await page.content();
    const normalized = normalize(html);

    assertCondition(
      viewportReport,
      'harbourview_email_present',
      normalized.includes('harbourviewcompany@gmail.com') && normalized.includes('mailto:harbourviewcompany@gmail.com'),
      'harbourviewcompany@gmail.com mailto reference missing from /contact HTML',
    );

    assertCondition(
      viewportReport,
      'legacy_email_absent',
      !normalized.includes('hello@harbourview.co'),
      'hello@harbourview.co appears in /contact HTML',
    );

    const leakageHits = forbiddenLeakageStrings.filter((term) => containsInsensitive(html, term));
    assertCondition(
      viewportReport,
      'forbidden_leakage_zero',
      leakageHits.length === 0,
      `Forbidden public leakage strings present: ${leakageHits.join(', ')}`,
    );

    const headerBox = await boundingBox(page.locator('header').first());
    assertCondition(
      viewportReport,
      'compact_header_spacing',
      Boolean(headerBox && headerBox.height <= (viewport.type === 'mobile' ? 98 : 104)),
      `Header is not compact enough. Height: ${headerBox?.height ?? 'missing'}`,
      { headerBox },
    );

    const hero = page.getByRole('heading', { name: /start a confidential harbourview conversation/i });
    const heroVisible = await hero.isVisible().catch(() => false);
    const heroBox = heroVisible ? await boundingBox(hero) : null;
    assertCondition(
      viewportReport,
      'visible_hero_copy',
      heroVisible && heroBox && heroBox.y < viewport.height,
      `Hero copy is not visible in initial ${viewport.label} viewport`,
      { heroBox },
    );

    const formHeading = page.getByRole('heading', { name: /send a reviewed inquiry/i });
    const formVisible = await formHeading.isVisible().catch(() => false);
    assertCondition(
      viewportReport,
      'carded_form_visible',
      formVisible,
      'Contact form card heading is not visible',
    );

    const formStyle = await page.locator('form').first().evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderTopWidth: style.borderTopWidth,
        borderColor: style.borderTopColor,
        color: style.color,
      };
    }).catch(() => null);

    assertCondition(
      viewportReport,
      'form_has_card_treatment',
      Boolean(formStyle && formStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && formStyle.borderTopWidth !== '0px'),
      `Form does not have visible card treatment. Computed style: ${JSON.stringify(formStyle)}`,
      { formStyle },
    );

    const button = page.getByRole('button', { name: /send message/i });
    await button.scrollIntoViewIfNeeded().catch(() => null);
    const buttonVisible = await button.isVisible().catch(() => false);
    const buttonStyle = buttonVisible
      ? await button.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            backgroundColor: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            color: style.color,
            opacity: style.opacity,
            borderColor: style.borderTopColor,
          };
        })
      : null;

    assertCondition(
      viewportReport,
      'gold_send_message_button_visible',
      Boolean(
        buttonVisible &&
          buttonStyle &&
          buttonStyle.opacity !== '0' &&
          buttonStyle.backgroundImage !== 'none' &&
          !buttonStyle.backgroundImage.includes('rgba(0, 0, 0, 0)')
      ),
      `Send Message button is not visibly styled as the gold primary CTA. Computed style: ${JSON.stringify(buttonStyle)}`,
      { buttonStyle },
    );

    const fullScreenshot = path.join(screenshotDir, `${viewport.label}-full.png`);
    await page.screenshot({ path: fullScreenshot, fullPage: true });
    viewportReport.screenshots.full = fullScreenshot;

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
    }));

    assertCondition(
      viewportReport,
      'no_horizontal_overflow',
      overflow.scrollWidth <= overflow.clientWidth + 2 && overflow.bodyScrollWidth <= overflow.bodyClientWidth + 2,
      `Horizontal overflow detected: ${JSON.stringify(overflow)}`,
      { overflow },
    );

    if (viewport.type === 'mobile') {
      await page.evaluate(() => window.scrollTo(0, 0));
      const menuButton = page.getByRole('button', { name: /toggle menu/i });
      const menuButtonVisible = await menuButton.isVisible().catch(() => false);
      assertCondition(
        viewportReport,
        'mobile_menu_button_visible',
        menuButtonVisible,
        'Mobile nav toggle button is not visible',
      );

      if (menuButtonVisible) {
        await menuButton.click();
        const expanded = await menuButton.getAttribute('aria-expanded');
        const requiredLinks = ['Network', 'Intelligence', 'Signals', 'Clinical Education', 'About', 'Contact'];
        const visibleLinks = [];
        for (const link of requiredLinks) {
          const visible = await page.getByRole('link', { name: link }).last().isVisible().catch(() => false);
          if (visible) visibleLinks.push(link);
        }

        const mobileNavScreenshot = path.join(screenshotDir, `${viewport.label}-mobile-nav-open.png`);
        await page.screenshot({ path: mobileNavScreenshot, fullPage: false });
        viewportReport.screenshots.mobileNavOpen = mobileNavScreenshot;

        assertCondition(
          viewportReport,
          'mobile_nav_opens_and_exposes_links',
          expanded === 'true' && requiredLinks.every((link) => visibleLinks.includes(link)),
          `Mobile nav did not open with expected links. expanded=${expanded}; visibleLinks=${visibleLinks.join(', ')}`,
          { expanded, visibleLinks },
        );
      }
    }

    viewportReport.passed = viewportReport.failures.length === 0;
    report.viewports.push(viewportReport);
    report.failures.push(...viewportReport.failures.map((failure) => `${viewport.label}: ${failure}`));

    await page.close();
  }
} finally {
  await browser.close();
}

report.verdict = report.failures.length === 0 ? 'PRODUCTION VERIFIED' : 'HOLD';

await fs.writeFile(path.join(artifactDir, 'contact-production-visual-verification.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(artifactDir, 'contact-production-visual-verification.md'), renderMarkdown(report));

console.log(report.verdict);
for (const failure of report.failures) console.error(`- ${failure}`);
if (report.failures.length > 0) process.exitCode = 1;

function assertCondition(viewportReport, key, passed, failure, details = {}) {
  viewportReport.checks[key] = { passed, ...details };
  if (!passed) viewportReport.failures.push(failure);
}

async function boundingBox(locator) {
  try {
    return await locator.boundingBox({ timeout: 5_000 });
  } catch {
    return null;
  }
}

function buildCacheBustedUrl(route) {
  const url = new URL(route, `${baseUrl}/`);
  url.searchParams.set('hv_contact_visual_verify', runId);
  url.searchParams.set('ts', String(Date.now()));
  return url.toString();
}

function cacheBypassHeaders() {
  return {
    'cache-control': 'no-cache, no-store, must-revalidate',
    pragma: 'no-cache',
    'user-agent': 'HarbourviewContactVisualVerification/1.0',
  };
}

function cleanBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function containsInsensitive(text, term) {
  return normalize(text).includes(String(term).toLowerCase());
}

function normalize(text) {
  return String(text || '')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u0026/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function renderMarkdown(result) {
  const lines = [];
  lines.push('# Harbourview Contact Production Visual Verification');
  lines.push('');
  lines.push(`Verdict: **${result.verdict}**`);
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push(`Base URL: \`${result.baseUrl}\``);
  lines.push(`Contact URL: ${result.contactUrl}`);
  lines.push(`Admin URL: ${result.adminUrl}`);
  lines.push('');
  lines.push('## Admin anonymous denial');
  lines.push('');
  lines.push(`Status: ${result.admin?.status ?? 'unknown'}`);
  lines.push(`Result: ${result.admin?.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');
  lines.push('## Viewport checks');
  lines.push('');
  lines.push('| Viewport | Status | Result | Top screenshot | Full screenshot |');
  lines.push('| --- | ---: | --- | --- | --- |');
  for (const viewport of result.viewports) {
    lines.push(`| ${viewport.label} | ${viewport.status} | ${viewport.passed ? 'PASS' : 'FAIL'} | ${viewport.screenshots.top || ''} | ${viewport.screenshots.full || ''} |`);
  }
  lines.push('');
  lines.push('## Failures');
  lines.push('');
  if (result.failures.length === 0) {
    lines.push('None.');
  } else {
    for (const failure of result.failures) lines.push(`- ${failure}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}
