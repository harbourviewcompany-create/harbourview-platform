import { redirect } from 'next/navigation'

/** Public /network entry hands off into Command Centre Network section. */
export default function Page() {
  redirect('/dashboard?section=network&page=experts')
}
