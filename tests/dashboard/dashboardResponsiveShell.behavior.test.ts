import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'

vi.mock('@/components/dashboard/CommandCentre', async () => {
  const { createElement: element } = await import('react')
  return {
    default: () => element('div', { 'data-dashboard-renderer': 'desktop' }, 'Desktop Command Centre'),
  }
})

vi.mock('@/components/dashboard/MobileCommandCentreRebuild', async () => {
  const { createElement: element } = await import('react')
  return {
    default: () => element('div', { 'data-dashboard-renderer': 'mobile' }, 'Mobile Command Centre'),
  }
})

import { DashboardResponsiveShellContent } from '@/components/dashboard/DashboardResponsiveShell'

const props: MobileCommandCentreProps = {
  signals: [],
  eduCategories: [],
  initialCountryIso2: 'CA',
  initialRoleId: 'exporter',
}

describe('DashboardResponsiveShellContent', () => {
  it('renders only the rebuilt mobile command below the breakpoint', () => {
    const markup = renderToStaticMarkup(createElement(DashboardResponsiveShellContent, {
      ...props,
      isMobile: true,
    }))

    expect(markup).toContain('data-dashboard-renderer="mobile"')
    expect(markup).not.toContain('data-dashboard-renderer="desktop"')
  })

  it('renders only the desktop CommandCentre at the desktop breakpoint', () => {
    const markup = renderToStaticMarkup(createElement(DashboardResponsiveShellContent, {
      ...props,
      isMobile: false,
    }))

    expect(markup).toContain('data-dashboard-renderer="desktop"')
    expect(markup).not.toContain('data-dashboard-renderer="mobile"')
  })
})
