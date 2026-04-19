import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Harbourview',
  description: 'Commercial intelligence and market access operations platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
