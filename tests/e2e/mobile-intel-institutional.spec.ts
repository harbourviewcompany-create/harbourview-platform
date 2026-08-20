import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const evidenceRoot = path.join(process.cwd(), 'artifacts', 'mobile-intel-institutional')

async function cssText() {
  return (await Promise.all([
    'components/dashboard/MobileCommandCentreRebuild.css',
    'components/dashboard/mobile-command/MobileCommandOperatorFirst.css',
    'components/dashboard/mobile-command/MobileIntelInstitutional.css',
  ].map(file => fs.readFile(path.join(process.cwd(), file), 'utf8')))).join('\n')
}

function sectionHeading(eyebrow: string, title: string, description: string) {
  return `<div class="hvm2-section-heading"><div><span>${eyebrow}</span><h2>${title}</h2><p>${description}</p></div></div>`
}

function signalCard(options: {
  market: string
  context: string
  title: string
  original?: string
  summary: string
  confidence: string
  source: string
  time: string
  note?: string
  primary?: boolean
  cta?: string
}) {
  return `<div class="hvm2-signal-card hvm2-intel-event-row"><article class="hvm2-intel-signal-card${options.primary ? ' hvm2-intel-primary' : ''}">
    <div class="hvm2-card-topline"><span class="hvm2-status-pill">${options.primary ? 'Open dossier' : 'REGULATORY_CHANGE'}</span><span>${options.market}</span></div>
    <div class="hvm2-intel-context-row"><span class="hvm2-status-pill">${options.context}</span>${options.note ? `<small>${options.note}</small>` : ''}</div>
    <h3>${options.title}</h3>
    ${options.original ? `<p class="hvm2-intel-original">${options.original}</p>` : ''}
    <p class="hvm2-intel-summary">${options.summary}</p>
    <div class="hvm2-intel-meta-row"><span>${options.confidence}</span><span>${options.source}</span><span>${options.time}</span></div>
    ${options.cta ? `<div class="hvm2-signal-footer"><strong>${options.cta}</strong></div>` : ''}
  </article></div>`
}

function weeklySignals() {
  return `<section class="hvm2-section" id="weekly-signals">
    ${sectionHeading('Intel / material changes', 'Intelligence requiring a decision', 'Jurisdiction matches for the active context appear first. Open supported events for evidence, unknowns and a reasoned decision posture.')}
    <div class="hvm2-intel-record-list" aria-label="Decision intelligence events">
      ${signalCard({
        market: 'GERMANY',
        context: 'Context match',
        title: 'German import requirements updated',
        original: 'Aktualisierte Importanforderungen für medizinisches Cannabis',
        summary: 'A reviewed German regulatory signal changed in the loaded command session.',
        confidence: 'Confidence 88%',
        source: 'Source BfArM',
        time: '2h ago',
        primary: true,
        cta: 'Open dossier →',
      })}
      ${signalCard({
        market: 'KENYA',
        context: 'Broader watch',
        title: 'Kenya – Rastafarian Use of Bhang Case heard through January 2026',
        summary: 'Monitor for developing relevance.',
        confidence: 'Confidence 90%',
        source: 'Source Unknown',
        time: '13h ago',
        note: "No direct Germany match is recorded in this signal's jurisdiction metadata.",
        cta: 'Open dossier →',
      })}
    </div>
  </section>`
}

function personalBriefing() {
  return `<section class="hvm2-section" id="personal-briefing">
    ${sectionHeading('Personal briefing', 'Importer briefing for Germany', 'A deterministic summary of the active jurisdiction, market pipeline, signal feed and next operational decisions.')}
    <div class="hvm2-briefing-decision-grid" aria-label="Briefing decision summary">
      <article><span>What changed</span><strong>A reviewed German regulatory signal changed in the loaded command session.</strong></article>
      <article><span>Why it matters</span><strong>Importer pathway review required before relying on the changed requirement.</strong></article>
    </div>
    <article class="hvm2-narrative-card hvm2-briefing-narrative"><span class="hvm2-intel-kicker">Longer briefing</span><p>Reviewed commercial pathway narrative for the active Germany importer context. The narrative remains distinct from the structured change and impact summary above it.</p><div class="hvm2-narrative-grid"><div><span>Commercial records</span><strong>4</strong></div><div><span>Signals tracked</span><strong>3</strong></div><div><span>Pipeline items</span><strong>2</strong></div><div><span>Action queue</span><strong>2</strong></div></div><p class="hvm2-briefing-meta">Evidence: Approved · 3 sources</p></article>
    <div class="hvm2-briefing-cadence" aria-label="Briefing cadence"><span class="hvm2-intel-kicker">Briefing cadence</span><p>Choose markets (ISO2) and how often Harbourview should synthesize a personal briefing.</p><div class="hvm2-cadence-row"><label><span>Markets (comma-separated ISO2)</span><input value="DE, CA" placeholder="CA, DE, AU" aria-label="Markets comma-separated ISO2"></label><label><span>Frequency</span><select aria-label="Briefing frequency"><option selected>Daily</option><option>Weekly</option></select></label></div><button type="button" class="hvm2-cadence-save">Save</button></div>
  </section>`
}

function metric(label: string, value: string, detail: string) {
  return `<article class="hvm2-metric"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`
}

function regulatoryWatch() {
  const items = Array.from({ length: 9 }, (_, index) => `<article class="hvm2-intel-record-card"><div class="hvm2-intel-meta-row"><span>Germany</span><span>regulation</span></div><strong>German regulatory watch ${index + 1}</strong><p>Reviewed change note ${index + 1}</p><small>Evidence metadata Unknown</small><div class="hvm2-intel-action"><span>Next action</span><p>Continue watch</p></div></article>`).join('')
  return `<section class="hvm2-section" id="regulatory">
    ${sectionHeading('Intel / regulatory watch', 'Regulatory change under watch', 'Tracked regulatory objects, active watch rules and the reviewed posture of the current jurisdiction.')}
    <div class="hvm2-metric-grid hvm2-regulatory-metrics">${metric('Tracked items', '9', 'Under active watch')}${metric('Watch rules', '2', 'Active keyword rules')}${metric('Rule hits', '1', 'In this session feed')}${metric('Source coverage', '3', 'Registered jurisdiction sources')}</div>
    <article class="hvm2-note hvm2-regulatory-posture"><span class="hvm2-status-pill">REGULATED</span><p>Germany regulatory outlook remains under active review.</p></article>
    <div class="hvm2-intel-record-list" aria-label="All 9 tracked regulatory items">${items}</div>
  </section>`
}

function recordCard(type: string, title: string, body: string, meta = '') {
  return `<article class="hvm2-intel-record-card">${meta ? `<div class="hvm2-intel-meta-row">${meta}</div>` : `<span class="hvm2-intel-record-type">${type}</span>`}<strong>${title}</strong><p>${body}</p></article>`
}

function localIntelligence() {
  return `<section class="hvm2-section" id="local-intel">
    ${sectionHeading('Intel / local intelligence', 'Jurisdiction intelligence for Germany', 'National authorities, subdivision differences, market-access routes, constraints and unresolved local questions in the reviewed record set.')}
    <div class="hvm2-local-intel-groups">
      <section><div class="hvm2-intel-group-heading"><span>Authorities</span><strong>Regulating bodies</strong><small>2 records</small></div><div class="hvm2-intel-record-list">${recordCard('Authority', 'Federal Institute for Drugs and Medical Devices (BfArM) / Cannabisagentur', 'National medical cannabis regulator: licences cultivation, processing, import/export and distribution to pharmacies.')}${recordCard('Authority', 'Federal Ministry of Health (Bundesgesundheitsministerium)', 'Policy oversight for the Cannabis Act framework.')}</div></section>
      <section><div class="hvm2-intel-group-heading"><span>Subdivisions</span><strong>Local activity</strong><small>2 records</small></div><div class="hvm2-intel-record-list">${recordCard('', 'North Rhine-Westphalia', 'Local activity record remains under review.', '<span>Subdivision</span><span>low</span>')}${recordCard('', 'Bavaria', 'Subdivision-level implementation record.', '<span>Subdivision</span><span>active</span>')}</div></section>
      <section><div class="hvm2-intel-group-heading"><span>Routes &amp; constraints</span><strong>Operating differences</strong><small>2 records</small></div><div class="hvm2-intel-record-list">${recordCard('Constraint', '◇ Constraint', 'A reviewed local constraint.')}${recordCard('Market-access route', '→ Route', 'A reviewed market-access route.')}</div></section>
      <section><div class="hvm2-intel-group-heading"><span>Unresolved</span><strong>Open questions</strong><small>2 records</small></div><article class="hvm2-note hvm2-open-questions"><span class="hvm2-status-pill">OPEN QUESTIONS</span><ul><li>Which subdivision differences materially affect importer operations?</li><li>Which local evidence remains incomplete?</li></ul></article></section>
    </div>
  </section>`
}

const searchCorpusSummary = `<div class="hvm2-search-summary" role="status"><span>Indexed 22 authenticated records</span><span>3 signals</span><span>1 marketplace</span><span>9 regulatory</span><span>4 jurisdiction / local</span><span>1 directory</span><span>1 genetics</span><span>1 actions</span><span>1 evidence</span><span>1 talent</span></div>`
const searchFilters = `<div class="hvm2-search-filters" role="group" aria-label="Search result type"><button class="active">All</button><button>Signals</button><button>Marketplace</button><button>Regulatory</button><button>Jurisdiction / local</button><button>Directory</button><button>Genetics</button><button>Actions</button><button>Evidence</button><button>Talent</button></div>`

function searchShell(body: string, value = '') {
  return `<section class="hvm2-section" id="search">
    ${sectionHeading('Cross-command search', 'Search authenticated command records', 'Search covers the record types already loaded into this authenticated command session; it does not broaden data access or bypass existing authorization boundaries.')}
    <label class="hvm2-search-field hvm2-search-field-large"><span>⌕</span><input aria-label="Search signals, markets, regulations, authorities, operators or actions" value="${value}" placeholder="Search signals, markets, regulations, authorities, operators or actions"></label>
    ${body}
  </section>`
}

function searchEmpty() {
  return searchShell(`${searchCorpusSummary}${searchFilters}<div class="hvm2-intel-search-prompt"><strong>Search the loaded command corpus</strong><p>Results appear only after a query. The indexed counts above describe corpus coverage, not search results.</p></div>`)
}

function result(kind: string, title: string, subtitle: string, meta: string) {
  return `<li><button type="button" class="hvm2-intel-search-result"><span class="hvm2-intel-search-kind">${kind}</span><strong>${title}</strong><p>${subtitle}</p><small>${meta}</small><i>→</i></button></li>`
}

function searchGermany() {
  const results = [
    result('Jurisdiction', '<mark>Germany</mark>', 'Reviewed German commercial pathway summary.', 'Germany · BfArM · approved'),
    result('Signal', 'German import requirements updated', 'A reviewed German regulatory signal changed in the loaded command session.', 'Germany · REGULATORY_CHANGE · 2h ago'),
    result('Authority', 'Federal Institute for Drugs and Medical Devices (BfArM) / Cannabisagentur', 'National medical cannabis regulator: licences cultivation, processing, import/export and distribution to pharmacies.', 'Germany'),
    result('Marketplace', 'German pharmacy supply lot', 'Reviewed marketplace record for Germany.', 'Germany · Cannabis · approved'),
    result('Regulatory watch', 'German regulatory watch 1', 'Reviewed change note 1', 'Germany · regulation'),
    result('Licensed operator', 'German Operator GmbH', 'Germany operator', 'Licensed operator · Reviewed'),
    result('Signal', 'Cannabis Social Clubs: Hier präsentieren wir erstmals eine vollständige Liste aller genehmigten Anbauvereinigungen und ihrer regulatorischen Einordnung in Deutschland', 'Langer deutschsprachiger Testdatensatz zur mobilen Umbruchprüfung und zur Prüfung sicherer Wortumbrüche.', 'Germany · SIGNAL · 5h ago'),
  ].join('')
  return searchShell(`<div class="hvm2-search-summary" role="status"><span>7 matched records</span><span>22 indexed records</span></div>${searchFilters}<div class="hvm2-search-results"><ul aria-label="Command search results">${results}</ul></div>`, 'Germany')
}

function shell(content: string, active: string) {
  const tabs = ['Weekly signals', 'Personal briefing', 'Regulatory watch', 'Local intelligence', 'Search']
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>__CSS__</style></head><body style="margin:0;background:#020814"><div class="hvm2-root" data-mobile-command-version="2" data-active-destination="weekly-signals"><header class="hvm-op-header"><div class="hvm-op-header-top"><div class="hvm-op-brand"><span class="hvm-op-wordmark">HARBOURVIEW</span><h1 class="hvm-op-page-title">Intel</h1></div><span class="hvm-op-current-chip">Current</span></div><button class="hvm-op-context-trigger" type="button"><span>🇩🇪 Germany · Importer / Buyer</span><span>⌄</span></button></header><nav class="hvm-op-secondary-nav" aria-label="Intel sections">${tabs.map(tab => `<button class="${tab === active ? 'active' : ''}" ${tab === active ? 'aria-current="page"' : ''}>${tab}</button>`).join('')}</nav><main class="hvm2-main hvm-op-main">${content}</main><nav class="hvm2-bottom-nav hvm-op-bottom-nav"><button><span>◎</span><small>Command</small></button><button><span>⊞</span><small>Market</small></button><button class="active"><span>≋</span><small>Intel</small></button><button><span>⚕</span><small>Clinical</small></button><button><span>→</span><small>Actions</small></button></nav></div></body></html>`
}

async function setState(page: Page, content: string, active: string, width: number, height: number, largeText = false) {
  await page.setViewportSize({ width, height })
  const largeTextCss = largeText ? `
    .hvm2-section-heading h2,.hvm-op-page-title{font-size:200%!important}
    .hvm2-section-heading p,.hvm2-intel-search-result>strong,.hvm2-intel-search-result>p,.hvm2-intel-search-result>small,.hvm2-search-summary,.hvm2-search-filters button,.hvm-op-secondary-nav button,.hvm-op-context-trigger>span:first-child,.hvm2-bottom-nav small{font-size:200%!important}
    .hvm2-intel-search-result,.hvm-op-secondary-nav button,.hvm2-search-filters button{min-height:44px;height:auto!important}
  ` : ''
  const css = `${await cssText()}\n${largeTextCss}`
  await page.setContent(shell(content, active).replace('__CSS__', css), { waitUntil: 'load' })
  await expect(page.locator('.hvm2-root')).toBeVisible()
  const activeTab = page.locator('.hvm-op-secondary-nav button[aria-current="page"]')
  await activeTab.evaluate(element => element.scrollIntoView({ inline: 'center', block: 'nearest' }))
  await expect(activeTab).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  const tabGeometry = await activeTab.evaluate(element => {
    const button = element.getBoundingClientRect()
    const nav = element.parentElement!.getBoundingClientRect()
    return { left: button.left, right: button.right, navLeft: nav.left, navRight: nav.right }
  })
  expect(tabGeometry.left).toBeGreaterThanOrEqual(tabGeometry.navLeft - 1)
  expect(tabGeometry.right).toBeLessThanOrEqual(tabGeometry.navRight + 1)
}

async function shot(page: Page, file: string) {
  await fs.mkdir(evidenceRoot, { recursive: true })
  await page.screenshot({ path: path.join(evidenceRoot, file), fullPage: false })
}

test.describe('Mobile Intel institutional visual evidence', () => {
  test('captures the six remediated Intel states at 390x844', async ({ page }) => {
    const states = [
      { file: 'after-01-weekly-signals-390x844.png', active: 'Weekly signals', content: weeklySignals() },
      { file: 'after-02-personal-briefing-390x844.png', active: 'Personal briefing', content: personalBriefing() },
      { file: 'after-03-regulatory-watch-390x844.png', active: 'Regulatory watch', content: regulatoryWatch() },
      { file: 'after-04-local-intelligence-390x844.png', active: 'Local intelligence', content: localIntelligence() },
      { file: 'after-05-search-empty-390x844.png', active: 'Search', content: searchEmpty() },
      { file: 'after-06-search-germany-390x844.png', active: 'Search', content: searchGermany() },
    ]
    for (const state of states) {
      await setState(page, state.content, state.active, 390, 844)
      await shot(page, state.file)
    }
  })
})
