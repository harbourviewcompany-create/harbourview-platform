import { redirect } from 'next/navigation'

// /intel-signals is the dashboard-internal label for the signals hub.
// The canonical public route is /signals. Redirect permanently.
export default function IntelSignalsPage() {
  redirect('/signals')
}
