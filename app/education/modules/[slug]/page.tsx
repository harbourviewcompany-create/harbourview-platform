import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  redirect(`/dashboard?page=education&section=education&educationView=library&module=${encodeURIComponent(slug)}`)
}
