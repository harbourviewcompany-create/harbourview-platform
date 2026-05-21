import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import InteractiveGlobe from '@/components/harbourview/globe/InteractiveGlobe'
import { HarbourviewGlobeRouteController } from '@/components/harbourview/globe/HarbourviewGlobeRouteController'

vi.mock('next/link', () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: string }) => <a href={href} className={className}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-canvas">{children}</div>,
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="mock-orbit-controls" />,
}))

describe('Harbourview globe accessibility', () => {
  it('adds a labeled interactive region and fallback instructions for the WebGL globe', () => {
    const markup = renderToStaticMarkup(<InteractiveGlobe />)

    expect(markup).toContain('role="region"')
    expect(markup).toContain('aria-labelledby="interactive-globe-title"')
    expect(markup).toContain('aria-describedby="interactive-globe-instructions interactive-globe-fallback"')
    expect(markup).toContain('id="interactive-globe-instructions"')
    expect(markup).toContain('id="interactive-globe-fallback"')
  })

  it('provides one polite live region and keyboard-operable controls in the route controller', () => {
    const markup = renderToStaticMarkup(<HarbourviewGlobeRouteController />)

    expect(markup).toContain('id="harbourview-globe-status"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('aria-atomic="true"')
    expect(markup).toContain('id="harbourview-globe-keyboard-instructions"')
    expect(markup).toContain('id="harbourview-globe-fallback-instructions"')
    expect(markup).toContain('aria-describedby="harbourview-globe-keyboard-instructions harbourview-globe-fallback-instructions harbourview-globe-status"')

    const buttonCount = (markup.match(/<button /g) ?? []).length
    const keyboardTypeCount = (markup.match(/type="button"/g) ?? []).length
    expect(buttonCount).toBeGreaterThan(0)
    expect(keyboardTypeCount).toBe(buttonCount)
  })
})
