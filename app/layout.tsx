import type { Metadata } from 'next'
import './globals.css'
import { ShellWrapper } from '@/components/ShellWrapper'

export const metadata: Metadata = {
  title: {
    default: 'Harbourview | Regulated Cannabis Market Routing & Intelligence',
    template: '%s | Harbourview',
  },
  description:
    'Harbourview helps serious operators in regulated cannabis markets route reviewed commercial requests, review public-safe intelligence, and begin controlled intake. Coverage is partial and reviewed as available.',
  openGraph: {
    siteName: 'Harbourview',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <ShellWrapper>{children}</ShellWrapper>
      </body>
    </html>
  )
}
