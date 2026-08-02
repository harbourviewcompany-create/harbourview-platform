import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MyBriefingsRedirect() {
  redirect('/dashboard?page=digest&module=personal-briefings')
}
