import type {Metadata} from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });

export const metadata: Metadata = {
  title: 'Harbourview | Command Centre',
  description: 'Global cannabis intelligence, marketplace, and education platform.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-hv-offwhite text-hv-navy min-h-screen antialiased flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
