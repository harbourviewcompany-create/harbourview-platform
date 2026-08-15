'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

type Message = {
  id: string
  sender_id: string | null
  message_type: string
  body: string
  created_at: string
}

type Room = {
  id: string
  title: string
  listing_ref: string | null
  status: string
  nda_required: boolean
}

const STATUS_LABEL: Record<string, string> = {
  active:       'Active',
  negotiating:  'In negotiation',
  agreed:       'Terms agreed',
  closed:       'Closed',
  cancelled:    'Cancelled',
}

export default function DealRoomPage() {
  const { id: roomId } = useParams<{ id: string }>()
  const [room, setRoom]       = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft]     = useState('')
  const [userId, setUserId]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const svc = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { db: { schema: SUPABASE_DB_SCHEMA } },
  ), [])

  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data: { user } } = await svc.auth.getUser()
      if (!user) { setError('Sign in to access deal rooms.'); setLoading(false); return }
      if (cancelled) return
      setUserId(user.id)

      const { data: roomData, error: roomErr } = await svc
        .from('deal_rooms')
        .select('id, title, listing_ref, status, nda_required')
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

    // Real-time subscription for new messages
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
  }, [roomId, svc])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!draft.trim() || !roomId || !userId || sending) return
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

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(245,240,232,.3)', fontSize: 13 }}>Loading deal room…</p>
    </main>
  )

  if (error) return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p style={{ color: 'rgba(245,240,232,.4)', fontSize: 14, marginBottom: 20 }}>{error}</p>
        <Link href="/marketplace/deals" style={{ fontSize: 12, color: '#d4a84b', textDecoration: 'none' }}>← Back to deal rooms</Link>
      </div>
    </main>
  )

  const isClosed = room?.status === 'closed' || room?.status === 'cancelled'

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>
      <style>{CSS}</style>

      {/* Header */}
      <header className="drv-header">
        <Link href="/marketplace/deals" className="drv-back">← Deal Rooms</Link>
        <div className="drv-header-main">
          <div>
            <h1 className="drv-title">{room?.title}</h1>
            {room?.listing_ref && <p className="drv-ref">Re: {room.listing_ref}</p>}
          </div>
          <span className="drv-status">{STATUS_LABEL[room?.status ?? ''] ?? room?.status}</span>
        </div>
        {room?.nda_required && (
          <p className="drv-nda-notice">⚠ NDA required — content of this room is confidential to participants only.</p>
        )}
      </header>

      {/* Message thread */}
      <div className="drv-thread">
        {messages.length === 0 ? (
          <div className="drv-thread-empty">
            <p>No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === userId
            return (
              <div key={msg.id} className={`drv-msg ${isOwn ? 'drv-msg--own' : 'drv-msg--other'}`}>
                {msg.message_type !== 'text' && (
                  <span className="drv-msg-type">{msg.message_type.replace('_', ' ')}</span>
                )}
                <p className="drv-msg-body">{msg.body}</p>
                <span className="drv-msg-time">
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

      {/* Composer */}
      {!isClosed ? (
        <div className="drv-composer">
          <textarea
            className="drv-composer-input"
            placeholder="Type your message…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            rows={3}
            disabled={sending}
          />
          <div className="drv-composer-actions">
            <span className="drv-composer-hint">Enter to send · Shift+Enter for new line</span>
            <button
              className="drv-send-btn"
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
          <p className="drv-disclaimer">
            This deal room is private to participants. Do not share sensitive personal data, credentials, or
            legally privileged information outside your own commercial judgement.
          </p>
        </div>
      ) : (
        <div className="drv-closed-notice">
          <p>This deal room is {room?.status}. No further messages can be sent.</p>
          <Link href="/marketplace/deals" className="drv-back">← Back to deal rooms</Link>
        </div>
      )}
    </main>
  )
}

const CSS = `
.drv-header {
  padding: 24px 32px 20px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  background: rgba(5,12,24,.95);
  position: sticky; top: 0; z-index: 10;
}
.drv-back { display: inline-block; font-size: 11px; color: #d4a84b; text-decoration: none; margin-bottom: 12px; letter-spacing: .06em; }
.drv-back:hover { opacity: .7; }
.drv-header-main { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.drv-title { font-size: 18px; font-weight: 600; color: #f5f0e8; margin: 0 0 4px; }
.drv-ref { font-size: 11px; color: rgba(245,240,232,.35); margin: 0; }
.drv-status {
  font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 8px;
  border: 1px solid rgba(76,175,130,.3); color: #4caf82;
  flex-shrink: 0; margin-top: 2px;
}
.drv-nda-notice { font-size: 11px; color: rgba(224,117,58,.7); margin: 10px 0 0; }

.drv-thread {
  flex: 1; overflow-y: auto;
  padding: 24px 32px;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 0;
}
.drv-thread-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: rgba(245,240,232,.25); font-size: 13px;
}
.drv-msg { max-width: 75%; display: flex; flex-direction: column; gap: 4px; }
.drv-msg--own { align-self: flex-end; align-items: flex-end; }
.drv-msg--other { align-self: flex-start; align-items: flex-start; }
.drv-msg-type {
  font-size: 9px; text-transform: uppercase; letter-spacing: .1em;
  color: #d4a84b; font-weight: 600; padding: 0 4px;
}
.drv-msg-body {
  padding: 10px 14px; border-radius: 10px;
  font-size: 13px; line-height: 1.55;
  white-space: pre-wrap; word-break: break-word;
  margin: 0;
}
.drv-msg--own .drv-msg-body { background: rgba(212,168,75,.12); color: #f5f0e8; border: 1px solid rgba(212,168,75,.15); }
.drv-msg--other .drv-msg-body { background: rgba(255,255,255,.04); color: rgba(245,240,232,.8); border: 1px solid rgba(255,255,255,.07); }
.drv-msg-time { font-size: 9px; color: rgba(245,240,232,.2); font-family: 'JetBrains Mono', ui-monospace, monospace; padding: 0 4px; }

.drv-composer {
  padding: 16px 32px 24px;
  border-top: 1px solid rgba(255,255,255,.07);
  background: rgba(5,12,24,.95);
}
.drv-composer-input {
  width: 100%; resize: none;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  padding: 12px 14px;
  color: #f5f0e8;
  font-size: 13px;
  line-height: 1.55;
  font-family: inherit;
  outline: none;
  transition: border-color .15s;
  box-sizing: border-box;
}
.drv-composer-input:focus { border-color: rgba(212,168,75,.3); }
.drv-composer-input::placeholder { color: rgba(245,240,232,.25); }
.drv-composer-actions {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 10px;
}
.drv-composer-hint { font-size: 10px; color: rgba(245,240,232,.2); }
.drv-send-btn {
  padding: 8px 20px;
  background: #d4a84b;
  color: #050c18;
  font-size: 12px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  border: none; border-radius: 4px; cursor: pointer;
  transition: opacity .15s;
}
.drv-send-btn:disabled { opacity: .4; cursor: default; }
.drv-send-btn:not(:disabled):hover { opacity: .85; }
.drv-disclaimer { font-size: 10px; color: rgba(245,240,232,.2); margin: 10px 0 0; line-height: 1.5; }

.drv-closed-notice {
  padding: 24px 32px;
  border-top: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; gap: 16px;
  color: rgba(245,240,232,.35); font-size: 13px;
}
`
