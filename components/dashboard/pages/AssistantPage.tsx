'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

type Message = {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  streaming?: boolean
}

const SUGGESTED_PROMPTS = [
  'What are the import licensing requirements for Germany?',
  'What GMP certifications are required for EU market access?',
  'What documentation is needed for a cross-border cannabis shipment?',
  'How do I verify a counterparty\'s licence status?',
  'What are the key compliance risks for cannabis exporters?',
  'Explain phytosanitary certificate requirements for cannabis.',
]

export interface AssistantPageProps {
  country: { iso2: string; label: string }
  region:  string
  role:    string
}

export const AssistantPage = React.memo(function AssistantPage({
  country, role,
}: AssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const abortRef                = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message     = { id: crypto.randomUUID(), role: 'user',      content: trimmed }
    const assistantId          = crypto.randomUUID()
    const assistantMsg: Message = { id: assistantId,       role: 'assistant',  content: '', streaming: true }

    setMessages((prev: Message[]) => [...prev, userMsg, assistantMsg])
    setDraft('')
    setLoading(true)

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      const history = messages.map((m: Message) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/compliance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: trimmed, country: country.label, role, history }),
        signal:  abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string }
        setMessages((prev: Message[]) => prev.map((m: Message) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err.error ?? 'Request failed'}`, streaming: false }
            : m,
        ))
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   acc     = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const snapshot = acc
        setMessages((prev: Message[]) => prev.map((m: Message) =>
          m.id === assistantId ? { ...m, content: snapshot } : m,
        ))
      }

      setMessages((prev: Message[]) => prev.map((m: Message) =>
        m.id === assistantId ? { ...m, streaming: false } : m,
      ))
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setMessages((prev: Message[]) => prev.map((m: Message) =>
          m.id === assistantId
            ? { ...m, content: 'Connection error. Please try again.', streaming: false }
            : m,
        ))
      }
    } finally {
      setLoading(false)
    }
  }, [loading, messages, country.label, role])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(draft)
    }
  }

  const clearHistory = () => {
    abortRef.current?.abort()
    setMessages([])
    setLoading(false)
  }

  return (
    <div className="ast-root">
      <style>{CSS}</style>

      {/* Header */}
      <div className="ast-header">
        <div>
          <h2 className="ast-heading">Compliance Intelligence</h2>
          <p className="ast-sub">
            {country.label}{role ? ` · ${role}` : ''} · AI regulatory guidance
          </p>
        </div>
        <div className="ast-header-right">
          {messages.length > 0 && (
            <button className="ast-clear" onClick={clearHistory}>
              New conversation
            </button>
          )}
          <div className="ast-status-badge">
            <span className="ast-status-dot" />
            Harbourview AI
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="ast-body">
        {messages.length === 0 ? (
          <div className="ast-empty">
            <div className="ast-empty-icon">◫</div>
            <h3 className="ast-empty-title">Compliance Intelligence Assistant</h3>
            <p className="ast-empty-desc">
              Ask anything about cannabis regulatory requirements, market access pathways,
              import/export compliance, GMP standards, or licensing across 191 jurisdictions.
              Jurisdiction and role context is automatically applied.
            </p>
            <div className="ast-prompts-grid">
              {SUGGESTED_PROMPTS.map(p => (
                <button key={p} className="ast-prompt-chip" onClick={() => void send(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ast-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`ast-msg ast-msg--${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="ast-avatar">◫</div>
                )}
                <div className={`ast-bubble ast-bubble--${msg.role}`}>
                  {msg.content
                    ? msg.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < msg.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))
                    : msg.streaming
                      ? null
                      : <span style={{ color: 'var(--ast-dim, rgba(245,240,232,.35))' }}>…</span>
                  }
                  {msg.streaming && <span className="ast-cursor">▋</span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input footer */}
      <div className="ast-footer">
        <div className="ast-input-wrap">
          <textarea
            className="ast-textarea"
            placeholder="Ask about compliance, licensing, import/export requirements, GMP standards…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
          />
          <button
            className="ast-send-btn"
            onClick={() => void send(draft)}
            disabled={!draft.trim() || loading}
            title="Send (Enter)"
          >
            {loading ? '···' : '→'}
          </button>
        </div>
        <p className="ast-disclaimer">
          AI-generated guidance. Verify regulatory requirements with qualified counsel in the relevant jurisdiction.
        </p>
      </div>
    </div>
  )
})

const CSS = `
.ast-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--cc-bg, #050c18);
  animation: astIn .25s ease;
}
@keyframes astIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

/* Header */
.ast-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 0;
  flex-shrink: 0;
  gap: 12px;
}
.ast-heading {
  font-family: 'Georgia', serif;
  font-size: 22px;
  font-weight: 400;
  color: #f5f0e8;
  margin: 0;
}
.ast-sub {
  font-size: 11px;
  color: rgba(245,240,232,.42);
  margin: 3px 0 0;
}
.ast-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.ast-clear {
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 6px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  color: rgba(245,240,232,.55);
  cursor: pointer;
  transition: background .12s, color .12s;
}
.ast-clear:hover { background: rgba(255,255,255,.1); color: #f5f0e8; }
.ast-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', 'Fira Mono', monospace;
  font-size: 9px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(245,240,232,.35);
  padding: 5px 10px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 6px;
}
.ast-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf82;
  box-shadow: 0 0 4px #4caf82;
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}

/* Body */
.ast-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
}
.ast-body::-webkit-scrollbar { width: 4px; }
.ast-body::-webkit-scrollbar-track { background: transparent; }
.ast-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 2px; }

/* Empty state */
.ast-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  text-align: center;
  padding: 24px;
}
.ast-empty-icon {
  font-size: 36px;
  color: rgba(212,168,75,.4);
}
.ast-empty-title {
  font-family: 'Georgia', serif;
  font-size: 18px;
  font-weight: 400;
  color: #f5f0e8;
  margin: 0;
}
.ast-empty-desc {
  font-size: 12px;
  color: rgba(245,240,232,.42);
  line-height: 1.6;
  max-width: 480px;
  margin: 0;
}
.ast-prompts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-width: 640px;
  width: 100%;
  margin-top: 8px;
}
.ast-prompt-chip {
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(212,168,75,.06);
  border: 1px solid rgba(212,168,75,.18);
  color: rgba(245,240,232,.65);
  font-size: 11px;
  text-align: left;
  cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
  line-height: 1.45;
}
.ast-prompt-chip:hover {
  background: rgba(212,168,75,.12);
  border-color: rgba(212,168,75,.35);
  color: #f5f0e8;
}

/* Messages */
.ast-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}
.ast-msg {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.ast-msg--user {
  flex-direction: row-reverse;
}
.ast-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(212,168,75,.12);
  border: 1px solid rgba(212,168,75,.25);
  display: grid;
  place-items: center;
  font-size: 13px;
  color: #d4a84b;
  flex-shrink: 0;
}
.ast-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  max-width: 85%;
}
.ast-bubble--assistant {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  color: rgba(245,240,232,.88);
  border-radius: 4px 12px 12px 12px;
}
.ast-bubble--user {
  background: rgba(212,168,75,.1);
  border: 1px solid rgba(212,168,75,.2);
  color: #f5f0e8;
  border-radius: 12px 4px 12px 12px;
  text-align: right;
}
.ast-cursor {
  display: inline-block;
  animation: blink .9s step-end infinite;
  color: #d4a84b;
  margin-left: 2px;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* Footer */
.ast-footer {
  flex-shrink: 0;
  padding: 12px 24px 16px;
  border-top: 1px solid rgba(255,255,255,.05);
}
.ast-input-wrap {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.ast-textarea {
  flex: 1;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px;
  color: #f5f0e8;
  font-size: 13px;
  font-family: inherit;
  padding: 10px 14px;
  resize: none;
  outline: none;
  transition: border-color .12s;
  line-height: 1.5;
}
.ast-textarea::placeholder { color: rgba(245,240,232,.25); }
.ast-textarea:focus { border-color: rgba(212,168,75,.4); }
.ast-textarea:disabled { opacity: .5; cursor: not-allowed; }
.ast-send-btn {
  height: 44px;
  width: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #d4a84b, #b88c35);
  border: none;
  color: #0d1117;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity .12s;
  display: grid;
  place-items: center;
}
.ast-send-btn:hover:not(:disabled) { opacity: .88; }
.ast-send-btn:disabled { opacity: .35; cursor: not-allowed; }
.ast-disclaimer {
  font-size: 9px;
  color: rgba(245,240,232,.22);
  margin: 8px 0 0;
  text-align: center;
  letter-spacing: .02em;
}
`
