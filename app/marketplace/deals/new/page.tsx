import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export default async function NewDealRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; title?: string }>
}) {
  const { listing: listingId, title: listingTitle } = await searchParams

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) redirect('/marketplace/deals')

  const cookieStore = await cookies()
  const svc = createClient(url, anonKey, {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
    global: { headers: { Cookie: cookieStore.toString() } },
  })

  const { data: { user } } = await svc.auth.getUser()
  if (!user) {
    const self = `/marketplace/deals/new${listingId ? `?listing=${listingId}&title=${encodeURIComponent(listingTitle ?? '')}` : ''}`
    redirect(`/auth/signin?next=${encodeURIComponent(self)}`)
  }

  // Return existing active room for this user + listing instead of creating a duplicate
  if (listingId) {
    const { data: existing } = await svc
      .from('deal_rooms')
      .select('id')
      .eq('listing_ref', listingId)
      .eq('initiator_id', user.id)
      .in('status', ['active', 'negotiating', 'agreed'])
      .maybeSingle()
    if (existing) redirect(`/marketplace/deals/${existing.id}`)
  }

  const roomTitle = listingTitle
    ? `Re: ${listingTitle.slice(0, 120)}`
    : 'New Deal Room'

  const { data: newRoom } = await svc
    .from('deal_rooms')
    .insert({
      title: roomTitle,
      listing_ref: listingId ?? null,
      initiator_id: user.id,
      status: 'active',
      nda_required: false,
    })
    .select('id')
    .single()

  if (!newRoom) redirect('/marketplace/deals')
  redirect(`/marketplace/deals/${newRoom.id}`)
}
