import type { ReactNode } from 'react';

export const metadata = {
  title: 'Factory App',
  description: 'Software factory scaffold application'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
