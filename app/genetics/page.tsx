import { redirect } from 'next/navigation'

/** Public genetics marketing entry — catalog lives on the marketplace surface. */
export default function GeneticsHomeRedirect() {
  redirect('/marketplace/genetics')
}
