const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_review: { bg: 'rgba(255,193,7,0.15)', text: '#FFC107' },
  approved: { bg: 'rgba(76,175,80,0.15)', text: '#66BB6A' },
  rejected: { bg: 'rgba(239,83,80,0.15)', text: '#EF5350' },
  archived: { bg: 'rgba(158,158,158,0.15)', text: '#9E9E9E' },
  superseded: { bg: 'rgba(158,158,158,0.1)', text: '#757575' },
  new: { bg: 'rgba(33,150,243,0.15)', text: '#42A5F5' },
  reviewed: { bg: 'rgba(255,193,7,0.15)', text: '#FFC107' },
  actioned: { bg: 'rgba(76,175,80,0.15)', text: '#66BB6A' },
  proposed: { bg: 'rgba(103,58,183,0.15)', text: '#9575CD' },
  inquiry_received: { bg: 'rgba(33,150,243,0.15)', text: '#42A5F5' },
  disclosure_requested: { bg: 'rgba(255,152,0,0.15)', text: '#FFA726' },
  disclosure_approved: { bg: 'rgba(0,188,212,0.15)', text: '#26C6DA' },
  introduced: { bg: 'rgba(198,165,90,0.15)', text: '#C6A55A' },
  closed_won: { bg: 'rgba(76,175,80,0.2)', text: '#81C784' },
  closed_lost: { bg: 'rgba(239,83,80,0.1)', text: '#EF9A9A' },
  requested: { bg: 'rgba(255,152,0,0.15)', text: '#FFA726' },
  declined: { bg: 'rgba(239,83,80,0.15)', text: '#EF5350' },
}

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: 'rgba(158,158,158,0.15)', text: '#9E9E9E' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '2px',
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
