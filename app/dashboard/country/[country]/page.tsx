import { notFound, redirect } from 'next/navigation'
import { buildCountryDashboardHref } from '@/lib/dashboard/navigationRoutes'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string }> }

export default async function CountryDashboardRedirect({ params }: Props) {
  const { country } = await params
  const href = buildCountryDashboardHref(country)
  if (!href) notFound()
  redirect(href)
}
