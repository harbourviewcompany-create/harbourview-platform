import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ShellWrapper } from '@/components/ShellWrapper'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'

export const metadata: Metadata = {
  title: {
    default: 'Harbourview | Regulated Cannabis Market Routing & Intelligence',
    template: '%s | Harbourview',
  },
  description:
    'Harbourview helps serious operators in regulated cannabis markets route reviewed commercial requests, review public-safe intelligence, and begin controlled intake. Coverage is partial and reviewed as available.',
  applicationName: 'Harbourview',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Harbourview',
  },
  icons: {
    icon: [{ url: '/icons/icon-192.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon-192.svg' }],
  },
  openGraph: {
    siteName: 'Harbourview',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#081423' },
    { media: '(prefers-color-scheme: light)', color: '#081423' },
  ],
  width: 'device-width',
  initialScale: 1,
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
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
