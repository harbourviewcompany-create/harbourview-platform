import type { Metadata, ReactNode } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Command Centre | Harbourview',
    template: '%s | Harbourview',
  },
}

/**
 * Layout for Command Centre jurisdiction routes (/country/*).
 * ShellWrapper suppresses public nav/footer for all /country/* paths.
 * JurisdictionBriefingPage renders its own CC header/breadcrumb.
 */
export default function CountryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020814] text-white">
      {children}
    </div>
  )
}
