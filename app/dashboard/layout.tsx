import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Dashboard | Harbourview' }
export default function DashboardLayout({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#06101d]">{children}</div> }
