import { notFound, redirect } from 'next/navigation'
import { buildCountryDashboardHref } from '@/lib/dashboard/navigationRoutes'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function CountryProfileRedirect({ params }: Props) {
  const { slug } = await params
  const href = buildCountryDashboardHref(slug)
  if (!href) notFound()
  redirect(href)
}
