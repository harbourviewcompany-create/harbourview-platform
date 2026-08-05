from pathlib import Path

model_path = Path('components/dashboard/mobile-command/useMobileCommandModel.ts')
spec_path = Path('tests/e2e/mobile-command-centre-v2.spec.ts')

model = model_path.read_text(encoding='utf-8')
old_close = """  const closeTool = useCallback(() => {
    setActiveTool(null)
    setSelectedListingId(null)
    router.replace(commandHref(activeSection, {
      marketView: activeMarketView,
      tool: null,
      listing: null,
    }), { scroll: false })
  }, [activeMarketView, activeSection, commandHref, router])
"""
new_close = """  const closeTool = useCallback(() => {
    const returnSection: SectionId = activeTool === 'financing-intake'
      ? 'financing'
      : activeTool
        ? 'marketplace'
        : activeSection
    setActiveTool(null)
    setSelectedListingId(null)
    setActiveSection(returnSection)
    lastUrlSection.current = returnSection
    router.replace(commandHref(returnSection, {
      marketView: activeMarketView,
      tool: null,
      listing: null,
    }), { scroll: false })
  }, [activeMarketView, activeSection, activeTool, commandHref, router])
"""
if model.count(old_close) != 1:
    raise SystemExit('expected one closeTool implementation')
model_path.write_text(model.replace(old_close, new_close), encoding='utf-8')

spec = spec_path.read_text(encoding='utf-8')
old_helper = """async function closeMarketplaceTool(page: Page, tool: string) {
  await page.getByRole('button', { name: 'Close marketplace workflow' }).click()
  await expect(page.locator(`[data-mobile-command-tool=\"${tool}\"]`)).toHaveCount(0)
  await expect.poll(() => {
    const url = new URL(page.url())
    return {
      tool: url.searchParams.get('tool'),
      listing: url.searchParams.get('listing'),
    }
  }).toEqual({ tool: null, listing: null })
}
"""
new_helper = """async function closeMarketplaceTool(page: Page, tool: string, marketView: string) {
  await page.getByRole('button', { name: 'Close marketplace workflow' }).click()
  await expect(page.locator(`[data-mobile-command-tool=\"${tool}\"]`)).toHaveCount(0)
  await expectCommandState(page, {
    page: 'marketplace',
    section: 'marketplace',
    marketView,
    tool: null,
    listing: null,
  })
}
"""
if spec.count(old_helper) != 1:
    raise SystemExit('expected one closeMarketplaceTool helper')
spec = spec.replace(old_helper, new_helper)

replacements = {
    "await closeMarketplaceTool(page, 'wanted-intake')": "await closeMarketplaceTool(page, 'wanted-intake', 'wanted')",
    "await closeMarketplaceTool(page, 'supply-intake')": "await closeMarketplaceTool(page, 'supply-intake', 'cannabis')",
    "await closeMarketplaceTool(page, 'introduction')": "await closeMarketplaceTool(page, 'introduction', 'cannabis')",
}
for old, new in replacements.items():
    if spec.count(old) != 1:
        raise SystemExit(f'expected one call: {old}')
    spec = spec.replace(old, new)

old_financing_close = """            await page.getByRole('button', { name: 'Close financing workflow' }).click()
            await expect(page.locator('[data-mobile-command-tool=\"financing-intake\"]')).toHaveCount(0)
            await expect.poll(() => new URL(page.url()).searchParams.get('tool')).toBeNull()
"""
new_financing_close = """            await page.getByRole('button', { name: 'Close financing workflow' }).click()
            await expect(page.locator('[data-mobile-command-tool=\"financing-intake\"]')).toHaveCount(0)
            await expectCommandState(page, {
              page: 'trade-calc',
              section: 'financing',
              marketView: 'cannabis',
              tool: null,
              listing: null,
            })
"""
if spec.count(old_financing_close) != 1:
    raise SystemExit('expected one financing close assertion')
spec = spec.replace(old_financing_close, new_financing_close)

old_finally = """      } finally {
        report.pageErrors = pageErrors
"""
new_finally = """      } finally {
        if (page) report.finalUrl = sanitizeUrlForEvidence(page.url())
        report.pageErrors = pageErrors
"""
if spec.count(old_finally) != 1:
    raise SystemExit('expected one evidence finally block')
spec_path.write_text(spec.replace(old_finally, new_finally), encoding='utf-8')
