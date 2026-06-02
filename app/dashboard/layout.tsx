import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardProvider } from '@/lib/dashboard/DashboardContext'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview market intelligence console for regulated cannabis operators.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <DashboardProvider>
        {children}
      </DashboardProvider>
    </Suspense>
  )
}
