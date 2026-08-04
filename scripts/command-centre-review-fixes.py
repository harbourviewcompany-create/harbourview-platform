from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one exact match, found {count}: {old[:120]!r}')
    file.write_text(text.replace(old, new, 1))


def regex_once(path: str, pattern: str, replacement: str) -> None:
    file = Path(path)
    text = file.read_text()
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{path}: expected one regex match, found {count}: {pattern[:120]!r}')
    file.write_text(updated)


e2e = 'tests/e2e/mobile-command-centre-v2.spec.ts'
replace_once(
    e2e,
    "import { COMMAND_CENTRE_PAGE_IDS } from '@/lib/platform/commandCentreRegistry'\n",
    "import { COMMAND_CENTRE_PAGE_IDS } from '@/lib/platform/commandCentreRegistry'\nimport { SECTION_NAV } from '@/components/dashboard/mobile-command/contracts'\n",
)
regex_once(
    e2e,
    r"const MOBILE_SECTION_IDS = \[.*?\] as const\n",
    "const MOBILE_SECTION_IDS = SECTION_NAV.map(section => section.id)\n",
)
regex_once(
    e2e,
    r"function isExpectedLocalDegradation\(response: FailedResponse\) \{.*?\n\}\n\nfunction sharedContextOptions",
    """function isExpectedLocalDegradation(response: FailedResponse) {
  if (!IS_ISOLATED_LOCAL_RUN || response.status >= 500) return false
  return (
    (response.pathname === '/api/ai/briefing' && response.status === 503)
    || (response.pathname === '/api/country-intel' && response.status === 404)
  )
}

function sharedContextOptions""",
)
replace_once(e2e, '    test.setTimeout(900_000)\n', '    test.setTimeout(1_800_000)\n')

replace_once(
    'components/dashboard/mobile-command/useMobileCommandModel.ts',
    "sectionNodes.current.get(resolvedUrlSection)?.scrollIntoView({ block: 'start' })",
    "sectionNodes.current.get(resolvedUrlSection)?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' })",
)

form = 'components/marketplace/DynamicMarketplaceIntakeForm.tsx'
replace_once(
    form,
    "import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'",
    "import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'",
)
replace_once(
    form,
    "  const formRef = useRef<HTMLFormElement>(null)\n\n  const typeKey",
    """  const formRef = useRef<HTMLFormElement>(null)
  const previewUrlsRef = useRef<string[]>([])

  useEffect(() => () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    previewUrlsRef.current = []
  }, [])

  const typeKey""",
)
regex_once(
    form,
    r"  function handleImageChange\(event: ChangeEvent<HTMLInputElement>\) \{.*?\n  \}\n\n  function removeImage\(index: number\) \{.*?\n  \}\n",
    """  function replaceImagePreviews(files: File[]) {
    const nextUrls = files.map(file => URL.createObjectURL(file))
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    previewUrlsRef.current = nextUrls
    setImagePreviews(nextUrls)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from<File>(event.target.files ?? []).filter(
      (file) => file.size <= MAX_IMAGE_BYTES,
    )
    const combined = [...imageFiles, ...incoming].slice(0, MAX_IMAGES)
    setImageFiles(combined)
    replaceImagePreviews(combined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    const updated = imageFiles.filter((_, itemIndex) => itemIndex !== index)
    setImageFiles(updated)
    replaceImagePreviews(updated)
  }
""",
)
replace_once(
    form,
    '        setImageFiles([])\n        setImagePreviews([])\n',
    '        setImageFiles([])\n        replaceImagePreviews([])\n',
)

page = 'app/dashboard/page.tsx'
replace_once(page, '  let hasOrg = true\n', '  let hasOrg = false\n')
regex_once(
    page,
    r"  const sectionToView = new Map<string, MarketView>\(\).*?\n  const buckets: Partial<DashboardMarketplaceRows> = \{\}\n  for \(const listing of listings\) \{.*?\n  \}\n",
    """  const buckets: Partial<DashboardMarketplaceRows> = {}
  for (const listing of listings) {
    const matchingViews = (Object.entries(VIEW_SECTIONS) as [MarketView, string[]][])
      .filter(([, sections]) => sections.includes(listing.marketplace_section))
      .map(([view]) => view)
    const views: MarketView[] = matchingViews.length > 0 ? matchingViews : ['cannabis']

    for (const view of views) {
      if (!buckets[view]) buckets[view] = []
      if (buckets[view]!.length < 8) buckets[view]!.push(mapListingToDashboardRow(listing))
    }
  }
""",
)
replace_once(
    page,
    '  const roleId = urlRole ?? storedRoleId\n\n  const commandData',
    """  const roleId = urlRole ?? storedRoleId
  let cannabisOperatorsRequest: ReturnType<typeof getCannabisOperators> | null = null
  const loadCannabisOperators = () => {
    cannabisOperatorsRequest ??= getCannabisOperators(countryIso2)
    return cannabisOperatorsRequest
  }

  const commandData""",
)
regex_once(
    page,
    r"      cannabisOperators: \{\n        load: \(\) => getCannabisOperators\(countryIso2\),\n        fallback: undefined,\n        sourceLabel: 'Public operator projection',\n        access: 'public',\n      \},\n",
    """      cannabisOperators: {
        load: loadCannabisOperators,
        fallback: undefined,
        sourceLabel: 'Public operator projection',
        access: 'public',
      },
      operatorLicenceMatrix: {
        load: async () => getOperatorLicenceMatrix((await loadCannabisOperators()).map(operator => operator.id)),
        fallback: { entitled: false as const },
        sourceLabel: 'Authorized operator licence matrix',
        access: 'operator',
      },
""",
)
replace_once(
    page,
    '    cannabisOperators,\n    cultivarPassports,\n',
    '    cannabisOperators,\n    operatorLicenceMatrix,\n    cultivarPassports,\n',
)
regex_once(
    page,
    r"  const watchlistAccess = checkFeatureAccess\(\{ app_metadata: userAppMetadata \}, 'watchlist'\)\n  const operatorLicenceMatrix = await getOperatorLicenceMatrix.*?\n\n  const pathwayData",
    "  const watchlistAccess = checkFeatureAccess({ app_metadata: userAppMetadata }, 'watchlist')\n\n  const pathwayData",
)

env_test = 'tests/supabase/env.test.ts'
replace_once(
    env_test,
    "import { afterEach, describe, expect, it, vi } from 'vitest'",
    "import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'",
)
replace_once(
    env_test,
    "describe('getSupabaseEnvStatus', () => {\n  afterEach",
    """describe('getSupabaseEnvStatus', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.CI
    delete process.env.HARBOURVIEW_LOCAL_TEST_BUILD
    delete process.env.NEXT_PUBLIC_HARBOURVIEW_LOCAL_TEST_BUILD
    delete process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.VERCEL
    delete process.env.VERCEL_ENV
    vi.unstubAllGlobals()
  })

  afterEach""",
)
replace_once(
    env_test,
    "    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    delete process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE\n",
    "    process.env.CI = '1'\n    process.env.HARBOURVIEW_LOCAL_TEST_BUILD = '1'\n    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    delete process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE\n",
)
replace_once(
    env_test,
    "    process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    delete process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE\n",
    "    process.env.NEXT_PUBLIC_HARBOURVIEW_LOCAL_TEST_BUILD = '1'\n    process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    delete process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE\n",
)
ipv6 = "    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    delete process.env.VERCEL\n    delete process.env.VERCEL_ENV\n\n    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(true)\n    expect(getSupabaseUrl()).toBe('http://[::1]:54321')"
replace_once(
    env_test,
    ipv6,
    "    process.env.CI = '1'\n    process.env.HARBOURVIEW_LOCAL_TEST_BUILD = '1'\n" + ipv6,
)
replace_once(
    env_test,
    "    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    process.env.VERCEL = '1'\n",
    "    process.env.CI = '1'\n    process.env.HARBOURVIEW_LOCAL_TEST_BUILD = '1'\n    process.env.NEXT_PUBLIC_HARBOURVIEW_LOCAL_TEST_BUILD = '1'\n    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    process.env.VERCEL = '1'\n",
)
alternate = "    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'\n    delete process.env.VERCEL\n    delete process.env.VERCEL_ENV\n\n    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(false)"
replace_once(
    env_test,
    alternate,
    "    process.env.CI = '1'\n    process.env.HARBOURVIEW_LOCAL_TEST_BUILD = '1'\n" + alternate,
)

replace_once(
    'docs/control/CLAUDE_PRODUCTION_COMMAND_CENTRE_HANDOFF.md',
    '`components/dashboard/MobileCommandCentreV2.tsx`',
    '`components/dashboard/MobileCommandCentreRebuild.tsx`',
)

css = Path('components/dashboard/MobileCommandCentreRebuild.css')
css_text = css.read_text()
if '.hvm2-search-results ul {' not in css_text:
    css.write_text(css_text.rstrip() + """

.hvm2-search-results ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hvm2-search-results li {
  min-width: 0;
}
""" + '\n')
