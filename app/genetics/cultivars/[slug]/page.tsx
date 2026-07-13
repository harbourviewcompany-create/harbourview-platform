import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/dashboard?page=genetics&cultivar=${slug}`)
}
