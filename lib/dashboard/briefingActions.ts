/**
 * Briefing action cards with optional deadline pressure from live signals.
 */
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '@/components/dashboard/CommandCentre'
import { getRoleCommandDefault } from '@/lib/dashboard/roleCommandDefaults'

export type BriefingAction = {
  page: CommandPage
  icon: string
  label: string
  why: string
  urgency: 'now' | 'soon' | 'watch'
  deadlineLabel?: string
}

function urgencyFromSignal(s: DashboardSignal): { urgency: BriefingAction['urgency']; deadlineLabel?: string } {
  const analysisDeadline = s.analysis?.deadline
  if (analysisDeadline) {
    const t = Date.parse(analysisDeadline)
    if (Number.isFinite(t)) {
      const days = (t - Date.now()) / 86_400_000
      if (days < 0) return { urgency: 'now', deadlineLabel: 'Deadline passed' }
      if (days <= 7) return { urgency: 'now', deadlineLabel: `Due in ${Math.ceil(days)}d` }
      if (days <= 30) return { urgency: 'soon', deadlineLabel: `Due in ${Math.ceil(days)}d` }
      return { urgency: 'watch', deadlineLabel: `Due ${new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` }
    }
    return { urgency: 'soon', deadlineLabel: analysisDeadline }
  }
  if (s.confidence >= 80) return { urgency: 'now', deadlineLabel: 'High confidence' }
  if (s.confidence >= 65) return { urgency: 'soon' }
  return { urgency: 'watch' }
}

const PAGE_ICONS: Partial<Record<CommandPage, string>> = {
  signals: '◉',
  regulatory: '◷',
  marketplace: '⊞',
  clinical: '✚',
  compliance: '◫',
  licences: '⊙',
  genetics: '❋',
  evidence: '▦',
  education: '◈',
  'access-pathway': '◎',
  'trade-calc': '¤',
  logistics: '⬡',
  prices: '⊞',
  kyb: '✓',
  briefing: '◎',
}

export function buildBriefingActions(input: {
  roleShort?: string | null
  signals: DashboardSignal[]
  playbook?: Array<{ page: CommandPage; icon: string; label: string; why: string }>
}): BriefingAction[] {
  const d = getRoleCommandDefault(input.roleShort)
  const playbook = [...(input.playbook ?? [])]

  // Prefer role priority order when playbook entries overlap.
  playbook.sort((a, b) => {
    const ia = d.priorities.indexOf(a.page)
    const ib = d.priorities.indexOf(b.page)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  if (playbook.length > 0) {
    return playbook.slice(0, 3).map((m, i) => {
      const related = input.signals.find((s) =>
        s.title.toLowerCase().includes(m.label.split(' ')[0]?.toLowerCase() ?? ''),
      )
      const u = related ? urgencyFromSignal(related) : { urgency: (i === 0 ? 'now' : 'soon') as BriefingAction['urgency'] }
      return { ...m, urgency: u.urgency, deadlineLabel: u.deadlineLabel }
    })
  }

  return d.priorities.slice(0, 3).map((page, i) => {
    const top = input.signals[i]
    const u = top ? urgencyFromSignal(top) : { urgency: (i === 0 ? 'soon' : 'watch') as BriefingAction['urgency'] }
    return {
      page,
      icon: PAGE_ICONS[page] ?? '◎',
      label: page.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      why: i === 0 ? d.focus : `Role-priority surface`,
      urgency: u.urgency,
      deadlineLabel: u.deadlineLabel,
    }
  })
}
