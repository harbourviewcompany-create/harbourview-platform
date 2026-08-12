'use client'

// Command Centre in-shell Deal Rooms panel. Adapted from the former standalone
// /marketplace/deals (+ /marketplace/deals/[id]) routes — same data model and
// realtime message subscription, but room selection is local component state
// instead of a URL param, so opening a room never navigates out of the shell.

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

type Room = {
  id: string
  title: string
  listing_ref: string | null
  status: string
  nda_required?: boolean
  created_at: string
  updated_at: string
}

type Message = {
  id: string
  sender_id: string | null
  message_type: string
  body: string
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  negotiating: 'In negotiation',
  agreed: 'Terms agreed',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

const STATUS_COLOR: Record<string, string> = {
  active: '#4caf82',
  negotiating: '#5b9bd5',
  agreed: '#d4a84b',
  closed: 'rgba(245,240,232,.25)',
  cancelled: '#e05555',
}

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { db: { schema: SUPABASE_DB_SCHEMA } },
  )
}

function RoomThread({ roomId, onBack }: { roomId: string; onBack: () => void }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const svc = getBrowserClient()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data: { user } } = await svc.auth.getUser()
      if (!user) { setError('Sign in to access deal rooms.'); setLoading(false); return }
      if (cancelled) return
      setUserId(user.id)

      const { data: roomData, error: roomErr } = await svc
        .from('deal_rooms')
        .select('id, title, listing_ref, status, nda_required, created_at, updated_at')
        .eq('id', roomId)
        .single()

      if (roomErr || !roomData) { setError('Deal room not found or you do not have access.'); setLoading(false); return }
      if (cancelled) return
      setRoom(roomData as Room)

      const { data: msgs } = await svc
        .from('deal_room_messages')
        .select('id, sender_id, message_type, body, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!cancelled) setMessages((msgs ?? []) as Message[])
      setLoading(false)
    }

    load()

    const channel = svc
      .channel(`deal-room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'deal_room_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      cancelled = true
      svc.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!draft.trim() || !userId || sending) return
    setSending(true)
    const body = draft.trim()
    setDraft('')
    const { error: err } = await svc.from('deal_room_messages').insert({
      room_id: roomId,
      sender_id: userId,
      message_type: 'text',
      body,
    })
    if (err) setError('Failed to send message. Please try again.')
    setSending(false)
  }

  if (loading) return <div className="cc-empty-state"><p>Loading deal room…</p></div>

  if (error) return (
    <div className="cc-empty-state">
      <p>{error}</p>
      <button className="cc-right-link" onClick={onBack}>← Back to deal rooms</button>
    </div>
  )

  const isClosed = room?.status === 'closed' || room?.status === 'cancelled'

  return (
    <div className="cc-dr-thread-wrap">
      <div className="cc-dr-thread-header">
        <button className="cc-right-link" onClick={onBack}>← Deal Rooms</button>
        <div className="cc-dr-thread-header-main">
          <div>
            <h3>{room?.title}</h3>
            {room?.listing_ref && <p className="cc-dr-ref">Re: {room.listing_ref}</p>}
          </div>
          <span className="cc-verify-badge ok">{STATUS_LABEL[room?.status ?? ''] ?? room?.status}</span>
        </div>
        {room?.nda_required && <p className="cc-dr-nda">⚠ NDA required — content is confidential to participants only.</p>}
      </div>

      <div className="cc-dr-thread">
        {messages.length === 0 ? (
          <div className="cc-empty-state"><p>No messages yet. Start the conversation below.</p></div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === userId
            return (
              <div key={msg.id} className={`cc-dr-msg ${isOwn ? 'cc-dr-msg--own' : 'cc-dr-msg--other'}`}>
                {msg.message_type !== 'text' && <span className="cc-dr-msg-type">{msg.message_type.replace('_', ' ')}</span>}
                <p className="cc-dr-msg-body">{msg.body}</p>
                <span className="cc-dr-msg-time">
                  {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {!isClosed ? (
        <div className="cc-dr-composer">
          <textarea
            className="cc-mkt-search"
            style={{ width: '100%', minHeight: 64, resize: 'vertical' }}
            placeholder="Type your message…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            rows={3}
            disabled={sending}
          />
          <div className="cc-dr-composer-actions">
            <span className="cc-dr-composer-hint">Enter to send · Shift+Enter for new line</span>
            <button className="cc-act-primary" onClick={sendMessage} disabled={!draft.trim() || sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
          <p className="cc-dr-disclaimer">
            This deal room is private to participants. Do not share sensitive personal data, credentials, or
            legally privileged information outside your own commercial judgement.
          </p>
        </div>
      ) : (
        <div className="cc-empty-state">
          <p>This deal room is {room?.status}. No further messages can be sent.</p>
        </div>
      )}
    </div>
  )
}

export function DealRoomsPanel({ initialRoomId = null }: { initialRoomId?: string | null } = {}) {
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const svc = getBrowserClient()
      const { data: { user } } = await svc.auth.getUser()
      if (!user) { if (!cancelled) { setIsLoggedIn(false); setRooms([]) }; return }
      if (cancelled) return
      setIsLoggedIn(true)
      const { data } = await svc
        .from('deal_rooms')
        .select('id, title, listing_ref, status, created_at, updated_at')
        .or(`initiator_id.eq.${user.id},counterparty_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })
      if (!cancelled) setRooms((data ?? []) as Room[])
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (selectedRoomId) {
    return <RoomThread roomId={selectedRoomId} onBack={() => setSelectedRoomId(null)} />
  }

  if (isLoggedIn === null) {
    return <div className="cc-empty-state"><p>Loading deal rooms…</p></div>
  }

  if (!isLoggedIn) {
    return (
      <div className="cc-empty-state">
        <span>◈</span>
        <p>Sign in to access deal rooms. Deal rooms are available to authenticated Harbourview members.</p>
      </div>
    )
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="cc-empty-state">
        <span>◈</span>
        <p>No active deal rooms. Deal rooms are initiated from marketplace listings — browse the marketplace, then open a deal room to start a private negotiation.</p>
      </div>
    )
  }

  return (
    <div className="cc-mkt-table">
      <div className="cc-mkt-thead">
        <span className="cc-mkt-th opp-col">ROOM</span>
        <span className="cc-mkt-th">STATUS</span>
        <span className="cc-mkt-th">UPDATED</span>
      </div>
      {rooms.map(room => {
        const color = STATUS_COLOR[room.status] ?? STATUS_COLOR.active
        return (
          <button key={room.id} className="cc-mkt-row cc-dr-room-row" onClick={() => setSelectedRoomId(room.id)}>
            <div className="cc-mkt-cell opp-col">
              <div className="cc-opp-icon">◈</div>
              <div className="cc-opp-body">
                <strong>{room.title}</strong>
                {room.listing_ref && <p>Re: {room.listing_ref}</p>}
              </div>
            </div>
            <div className="cc-mkt-cell">
              <span className="cc-verify-badge ok" style={{ color, borderColor: `${color}40` }}>{STATUS_LABEL[room.status] ?? room.status}</span>
            </div>
            <div className="cc-mkt-cell">{new Date(room.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </button>
        )
      })}
    </div>
  )
}
