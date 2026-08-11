import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('marketplace media merge-readiness integration contracts', () => {
  it('consumes the projection by view plus canonical listing id', () => {
    const model = read('components/dashboard/mobile-command/useMobileCommandModel.ts')
    expect(model).toContain("import { marketplaceMediaKey } from '@/lib/dashboard/marketplaceMediaProjection'")
    expect(model).toContain('props.marketplaceMediaById?.[marketplaceMediaKey(tab.id, listingId)]')
    expect(model).toContain('row.id === selectedListingId && row.view === activeMarketView')
  })

  it('triggers the authenticated visual gate for marketplace media implementation and schema changes', () => {
    const workflow = read('.github/workflows/mobile-command-centre-v2-visual.yml')
    for (const requiredPath of [
      'lib/dashboard/buildDashboardCommandSources.ts',
      'lib/dashboard/marketplaceMediaProjection.ts',
      'lib/marketplace/images/**',
      'supabase/migrations/*marketplace*.sql',
    ]) {
      expect(workflow).toContain(`- ${requiredPath}`)
    }
  })
})
