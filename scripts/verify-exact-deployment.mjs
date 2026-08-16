import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const required = (name) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const expectedGitSha = required('EXPECTED_GIT_SHA')
const expectedDeploymentId = required('EXPECTED_DEPLOYMENT_ID')
const expectedEnvironment = required('EXPECTED_ENVIRONMENT')
const expectedProjectId = required('EXPECTED_PROJECT_ID')
const oidcToken = required('VERCEL_TRUSTED_OIDC_TOKEN')
const rawDeploymentUrl = required('HARBOURVIEW_DEPLOYMENT_URL')

if (!/^[0-9a-f]{40}$/i.test(expectedGitSha)) {
  throw new Error(`EXPECTED_GIT_SHA is not a full 40-character Git SHA: ${expectedGitSha}`)
}
if (!/^dpl_[A-Za-z0-9]+$/.test(expectedDeploymentId)) {
  throw new Error(`EXPECTED_DEPLOYMENT_ID is not a Vercel deployment id: ${expectedDeploymentId}`)
}
if (!/^prj_[A-Za-z0-9]+$/.test(expectedProjectId)) {
  throw new Error(`EXPECTED_PROJECT_ID is not a Vercel project id: ${expectedProjectId}`)
}
if (!['preview', 'production'].includes(expectedEnvironment)) {
  throw new Error(`EXPECTED_ENVIRONMENT must be preview or production, got: ${expectedEnvironment}`)
}

const deploymentUrl = new URL(rawDeploymentUrl)
if (deploymentUrl.protocol !== 'https:') throw new Error('Deployment URL must use https')
if (!/^harbourview-[a-z0-9]+-harbourview\.vercel\.app$/i.test(deploymentUrl.hostname)) {
  throw new Error(`Deployment URL is not an immutable Harbourview Vercel deployment hostname: ${deploymentUrl.hostname}`)
}
const baseUrl = deploymentUrl.origin
const trustedOidcHeader = { 'x-vercel-trusted-oidc-idp-token': oidcToken }
const artifactDir = path.resolve('production-browser-verification-artifacts')
const screenshotDir = path.join(artifactDir, 'screenshots')
const traceDir = path.join(artifactDir, 'traces')
await mkdir(screenshotDir, { recursive: true })
await mkdir(traceDir, { recursive: true })

const identityResponse = await fetch(`${baseUrl}/api/release-identity`, {
  headers: trustedOidcHeader,
  redirect: 'manual',
})
if (!identityResponse.ok) {
  throw new Error(`Release identity probe failed: HTTP ${identityResponse.status}`)
}
const identity = await identityResponse.json()
const identityFailures = []
if (identity.gitSha !== expectedGitSha) identityFailures.push(`gitSha expected ${expectedGitSha}, got ${identity.gitSha}`)
if (identity.deploymentId !== expectedDeploymentId) identityFailures.push(`deploymentId expected ${expectedDeploymentId}, got ${identity.deploymentId}`)
if (identity.deploymentUrl !== baseUrl) identityFailures.push(`deploymentUrl expected ${baseUrl}, got ${identity.deploymentUrl}`)
if (identity.projectId !== expectedProjectId) identityFailures.push(`projectId expected ${expectedProjectId}, got ${identity.projectId}`)
if (identity.environment !== expectedEnvironment) identityFailures.push(`environment expected ${expectedEnvironment}, got ${identity.environment}`)
if (identityFailures.length) throw new Error(`Deployment identity mismatch: ${identityFailures.join('; ')}`)

const forbidden = [
  'sourceUrl',
  'provenanceSummary',
  'reviewedBy',
  'internalReviewNotes',
  'sourceEvidence',
  'sourceName',
  'Evidence captured',
  'verificationStatus',
  'sellerAuthorizationStatus',
]
const routes = ['/', '/marketplace', '/contact', '/admin']
const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'mobile-390x844', width: 390, height: 844 },
]
const failures = []
const consoleErrors = []
const screenshots = []

const browser = await chromium.launch()
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    })
    await context.route('**/*', async (route) => {
      const request = route.request()
      const requestUrl = new URL(request.url())
      if (requestUrl.origin === baseUrl) {
        await route.continue({
          headers: {
            ...request.headers(),
            ...trustedOidcHeader,
          },
        })
        return
      }
      await route.continue()
    })
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
    const page = await context.newPage()
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${viewport.name}: ${message.text()}`)
    })
    page.on('pageerror', (error) => failures.push(`${viewport.name}: pageerror: ${error.message}`))

    for (const route of routes) {
      const label = `${viewport.name} ${route}`
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      const status = response?.status() ?? 0
      if (route === '/admin') {
        if (![200, 401, 403].includes(status)) failures.push(`${label}: unexpected HTTP ${status}`)
      } else if (status !== 200) {
        failures.push(`${label}: expected HTTP 200, got ${status}`)
      }

      const html = await page.content()
      for (const token of forbidden) {
        if (html.includes(token)) failures.push(`${label}: forbidden public token exposed: ${token}`)
      }
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      if (overflow.scrollWidth > overflow.clientWidth + 2) {
        failures.push(`${label}: horizontal overflow ${JSON.stringify(overflow)}`)
      }
      const screenshot = path.join(screenshotDir, `${viewport.name}-${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`)
      await page.screenshot({ path: screenshot, fullPage: true })
      screenshots.push(path.relative(process.cwd(), screenshot))
    }

    await context.tracing.stop({ path: path.join(traceDir, `${viewport.name}.zip`) })
    await context.close()
  }
} finally {
  await browser.close()
}

const browserHealthy = failures.length === 0 && consoleErrors.length === 0
const evidence = {
  status: browserHealthy ? 'GO' : 'HOLD',
  checkedAt: new Date().toISOString(),
  expected: {
    gitSha: expectedGitSha,
    deploymentId: expectedDeploymentId,
    deploymentUrl: baseUrl,
    projectId: expectedProjectId,
    environment: expectedEnvironment,
  },
  observed: identity,
  authentication: 'github-actions-oidc-trusted-source',
  routes,
  viewports,
  screenshots,
  failures,
  consoleErrors,
}
await writeFile(path.join(artifactDir, 'release-evidence.json'), JSON.stringify(evidence, null, 2))

if (!browserHealthy) {
  console.error(JSON.stringify(evidence, null, 2))
  process.exit(1)
}
console.log(JSON.stringify(evidence, null, 2))
