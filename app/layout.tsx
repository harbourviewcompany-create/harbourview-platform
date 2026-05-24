import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Harbourview | Regulated Cannabis Market Access & Intelligence',
    template: '%s | Harbourview',
  },
  description:
    'Harbourview gives serious operators in regulated cannabis markets the intelligence, introductions, and access pathways that aren\'t available publicly.',
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
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
