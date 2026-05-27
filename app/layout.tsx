import type { Metadata } from 'next'
import './globals.css'
import { ShellWrapper } from '@/components/ShellWrapper'

export const metadata: Metadata = {
  title: {
    default: 'Harbourview | Regulated Cannabis Market Access & Intelligence',
    template: '%s | Harbourview',
  },
  description:
    "Harbourview gives serious operators in regulated cannabis markets the intelligence, introductions, and access pathways that aren't available publicly.",
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
