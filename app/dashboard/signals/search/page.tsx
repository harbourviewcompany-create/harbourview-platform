import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SignalSearchRedirect() {
  redirect('/dashboard?page=signals&module=search')
}
