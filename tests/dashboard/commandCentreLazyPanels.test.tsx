import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { parseHTML } from 'linkedom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CommandCentre, { type CommandPage } from '@/components/dashboard/CommandCentre'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => createElement('a', { href }, children) }))
vi.mock('@/components/dashboard/useDashboardSignalsRealtime', () => ({
  useDashboardSignalsRealtime: (signals: unknown[]) => ({ signals, status: 'live' }),
}))

let root: Root | undefined
let container: HTMLElement
let errors: unknown[]

beforeEach(() => {
  const { window, document } = parseHTML('<html><body><div id="root"></div></body></html>')
  vi.stubGlobal('window', window)
  vi.stubGlobal('document', document)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  container = document.getElementById('root') as HTMLElement
  errors = []
  root = createRoot(container, { onUncaughtError: error => errors.push(error) })
})

afterEach(async () => {
  if (root) await act(async () => root?.unmount())
  root = undefined
  vi.unstubAllGlobals()
})

describe('dashboard lazy panel transitions', () => {
  it.each<CommandPage>(['banking', 'prices', 'logistics', 'jobs', 'insurance', 'trade-calc'])(
    'loads %s without changing hook order between loading and content', async initialPage => {
      await act(async () => {
        root!.render(createElement(CommandCentre, {
          signals: [], eduCategories: [], initialCountryIso2: 'CA',
          initialRoleId: 'exporter', initialPage,
        }))
      })
      await vi.waitFor(async () => {
        await act(async () => {})
        expect(container.querySelector('.cc-page-loading')).toBeNull()
        expect(container.textContent?.length).toBeGreaterThan(0)
      })
      expect(errors).toEqual([])
    },
  )
})
