import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Your Harbourview commercial dashboard — market intelligence, listings, and active opportunities.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen overflow-hidden" style={{ background: 'var(--hv-bg-950, #03070D)' }}>
      {children}
    </div>
  )
}
