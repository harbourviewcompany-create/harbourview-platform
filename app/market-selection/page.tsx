import type { Metadata } from 'next'
import { MobileCountrySelection } from '@/components/harbourview/MobileCountrySelection'

export const metadata: Metadata = {
  title: 'Harbourview | Select Your Market',
  description:
    'Select your country to begin. Harbourview routes regulated cannabis market access, intelligence, and reviewed introductions through a controlled country-first interface.',
  openGraph: {
    title: 'Harbourview | Select Your Market',
    description: 'Controlled market-access intelligence and reviewed commercial routing for regulated markets.',
  },
}

export default function MarketSelectionPage() {
  return <MobileCountrySelection initialCountry="" />
}
