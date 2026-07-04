'use client'

import React, { useState, useEffect } from 'react'
import type { WatchlistData, WatchRule } from '@/lib/dashboard/dashboardLiveData'
import { createClient } from '@/lib/supabase/client'

export interface WatchlistPageProps {
  country:       { iso2: string; label: string }
  region:        string
  role:          string
  watchlistData?: WatchlistData | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

const ITEM_ICONS: Record<string, string> = {
  jurisdiction: '🌐', signal: '≋', pathway: '◈',
  marketplace_item: '⊞', source: '⊟', policy: '◎',
}

const RULE_TYPE_LABELS: Record<string, string> = {
  keyword_signal:       'Signal keyword match',
  jurisdiction_change:  'Jurisdiction status change',
  market_listing:       'New marketplace listing',
  regulatory_update:    'Regulatory update',
  counterparty_activity:'Counterparty activity',
}

const RULE_TYPES = Object.keys(RULE_TYPE_LABELS)

export const WatchlistPage = React.memo(function WatchlistPage({
  country, watchlistData,
}: WatchlistPageProps) {
  const [addState, setAddState]     = useState<'idle' | 'saving' | 'saved'>('idle')
  const [localItems, setLocalItems] = useState(watchlistData?.items ?? [])
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [snoozingId, setSnoozingId]   = useState<string | null>(null)
  const [editingNextActionId, setEditingNextActionId] = useState<string | null>(null)
  const [nextActionDraft, setNextActionDraft]         = useState('')
  const [savingNextActionId, setSavingNextActionId]   = useState<string | null>(null)

  // Rule builder state
  const [localRules, setLocalRules]   = useState<WatchRule[]>(watchlistData?.rules ?? [])
  const [ruleType, setRuleType]       = useState(RULE_TYPES[0])
  const [ruleKeywords, setRuleKeywords] = useState('')
  const [ruleState, setRuleState]     = useState<'idle' | 'saving' | 'error'>('idle')
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null)

  useEffect(() => {
    setLocalItems(watchlistData?.items ?? [])
  }, [watchlistData])

  useEffect(() => {
    setLocalRules(watchlistData?.rules ?? [])
  }, [watchlistData])

  async function getOrgId(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/sign-in'; return null }
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()
    return membership?.workspace_id ?? null
  }

  async function handleResolve(id: string) {
    if (resolvingId) return
    setResolvingId(id)
    const previous = localItems
    setLocalItems(prev => prev.filter(item => item.id !== id))
    try {
      const supabase = createClient()
      const { error } = await supabase.from('cc_watchlist_items').update({ watch_status: 'resolved' }).eq('id', id)
      if (error) throw error
    } catch {
      setLocalItems(previous)
    } finally {
      setResolvingId(null)
    }
  }

  async function handleSnooze(id: string) {
    if (snoozingId) return
    setSnoozingId(id)
    const previous = localItems
    setLocalItems(prev => prev.filter(item => item.id !== id))
    try {
      const supabase = createClient()
      const snoozeUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { error } = await supabase
        .from('cc_watchlist_items')
        .update({ watch_status: 'snoozed', snoozed_until: snoozeUntil })
        .eq('id', id)
      if (error) throw error
    } catch {
      setLocalItems(previous)
    } finally {
      setSnoozingId(null)
    }
  }

  function handleStartEditNextAction(id: string, current: string | null) {
    setEditingNextActionId(id)
    setNextActionDraft(current ?? '')
  }

  async function handleSaveNextAction(id: string) {
    if (savingNextActionId) return
    setSavingNextActionId(id)
    const trimmed = nextActionDraft.trim() || null
    setLocalItems(prev => prev.map(item => item.id === id ? { ...item, next_action: trimmed } : item))
    setEditingNextActionId(null)
    try {
      const supabase = createClient()
      await supabase.from('cc_watchlist_items').update({ next_action: trimmed }).eq('id', id)
    } finally {
      setSavingNextActionId(null)
    }
  }

  async function handleRemove(id: string) {
    if (removingId) return
    setRemovingId(id)
    const previous = localItems
    setLocalItems(previous.filter(item => item.id !== id))
    try {
      const supabase = createClient()
      const { error } = await supabase.from('cc_watchlist_items').delete().eq('id', id)
      if (error) throw error
    } catch {
      setLocalItems(previous)
    } finally {
      setRemovingId(null)
    }
  }

  async function handleAddToWatchlist() {
    if (addState !== 'idle') return
    setAddState('saving')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/sign-in'; return }
      const orgId = await getOrgId()
      if (!orgId) { setAddState('idle'); return }
      await supabase.from('cc_watchlist_items').insert({
        org_id:       orgId,
        added_by:     session.user.id,
        item_type:    'jurisdiction',
        title:        country.label,
        jurisdiction: country.iso2,
        watch_status: 'active',
      })
      setAddState('saved')
    } catch {
      setAddState('idle')
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault()
    if (ruleState === 'saving') return
    const keywords = ruleKeywords.split(',').map(k => k.trim()).filter(Boolean)
    setRuleState('saving')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/sign-in'; return }
      const orgId = await getOrgId()
      if (!orgId) { setRuleState('error'); return }
      const { data, error } = await supabase
        .from('cc_watch_rules')
        .insert({ org_id: orgId, created_by: session.user.id, rule_type: ruleType, keywords, is_active: true })
        .select('id, rule_type, keywords, is_active')
        .single()
      if (error) throw error
      setLocalRules(prev => [data as WatchRule, ...prev])
      setRuleKeywords('')
      setRuleState('idle')
    } catch {
      setRuleState('error')
      setTimeout(() => setRuleState('idle'), 2000)
    }
  }

  async function handleDeleteRule(id: string) {
    if (deletingRuleId) return
    setDeletingRuleId(id)
    const previous = localRules
    setLocalRules(prev => prev.filter(r => r.id !== id))
    try {
      const supabase = createClient()
      const { error } = await supabase.from('cc_watch_rules').delete().eq('id', id)
      if (error) throw error
    } catch {
      setLocalRules(previous)
    } finally {
      setDeletingRuleId(null)
    }
  }

  async function handleToggleRule(rule: WatchRule) {
    if (togglingRuleId) return
    setTogglingRuleId(rule.id)
    const newActive = !rule.is_active
    setLocalRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: newActive } : r))
    try {
      const supabase = createClient()
      const { error } = await supabase.from('cc_watch_rules').update({ is_active: newActive }).eq('id', rule.id)
      if (error) throw error
    } catch {
      setLocalRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: rule.is_active } : r))
    } finally {
      setTogglingRuleId(null)
    }
  }

  const items   = localItems
  const notifs  = watchlistData?.notifications
  const rules   = localRules
  const hasItems = items.length > 0
  const activeRules = rules.filter(r => r.is_active).length

  return (
    <div className="wl-root">
      <style>{CSS}</style>

      <div className="wl-header">
        <div>
          <h1 className="wl-heading">Watchlist</h1>
          <p className="wl-sub">
            {hasItems
              ? `${items.length} tracked item${items.length !== 1 ? 's' : ''} · ${activeRules} active watch rule${activeRules !== 1 ? 's' : ''}`
              : 'Track markets, signals, and counterparties'}
          </p>
        </div>
        <a href="/intelligence" className="wl-cta-outline">Browse Markets</a>
      </div>

      {/* Notification summary */}
      {notifs && notifs.total_alerts > 0 && (
        <div className="wl-notifs">
          <div className="wl-section-head">NOTIFICATIONS</div>
          <div className="wl-notif-grid">
            {[
              { label: 'Total',    val: notifs.total_alerts,    color: 'var(--wl-gold)' },
              { label: 'Awaiting', val: notifs.awaiting_review, color: '#5b9bd5' },
              { label: 'Resolved', val: notifs.resolved,        color: '#4caf82' },
              { label: 'Snoozed',  val: notifs.snoozed,         color: 'rgba(245,240,232,.4)' },
            ].map(r => (
              <div key={r.label} className="wl-notif-cell">
                <span className="wl-notif-val" style={{ color: r.color }}>{r.val}</span>
                <span className="wl-notif-label">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current session market */}
      <div className="wl-current">
        <div className="wl-section-head">CURRENTLY VIEWING</div>
        <div className="wl-current-card">
          <div className="wl-current-flag">🌐</div>
          <div className="wl-current-info">
            <div className="wl-current-name">{country.label}</div>
            <div className="wl-current-label">Active session · Not saved</div>
          </div>
          <button
            className={`wl-add-btn${addState === 'saved' ? ' wl-add-btn--saved' : ''}`}
            onClick={handleAddToWatchlist}
            disabled={addState !== 'idle'}
          >
            {addState === 'saved' ? '✓ Watching' : addState === 'saving' ? 'Saving…' : '+ Add to Watchlist'}
          </button>
        </div>
      </div>

      {/* Watched items */}
      {hasItems ? (
        <div className="wl-items">
          <div className="wl-section-head">WATCHING ({items.length})</div>
          <div className="wl-item-list">
            {items.map(item => (
              <div key={item.id} className="wl-item">
                <div className="wl-item-icon">{ITEM_ICONS[item.item_type] ?? '◈'}</div>
                <div className="wl-item-body">
                  <div className="wl-item-top">
                    <span className="wl-item-title">{item.title}</span>
                    {item.jurisdiction && <span className="wl-item-tag">{item.jurisdiction}</span>}
                    {(item.tags ?? []).map((t: string) => (
                      <span key={t} className="wl-item-tag wl-item-tag--muted">{t}</span>
                    ))}
                  </div>
                  {item.subtitle && <div className="wl-item-sub">{item.subtitle}</div>}
                  {item.latest_change_note && (
                    <div className="wl-item-change">
                      {item.latest_change_note}
                      {item.latest_change_at && <span className="wl-item-time"> · {timeAgo(item.latest_change_at)}</span>}
                    </div>
                  )}
                  {editingNextActionId === item.id ? (
                    <div className="wl-item-next-edit">
                      <input
                        className="wl-item-next-input"
                        value={nextActionDraft}
                        onChange={e => setNextActionDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveNextAction(item.id); if (e.key === 'Escape') setEditingNextActionId(null) }}
                        autoFocus
                        placeholder="Next action…"
                        maxLength={200}
                      />
                      <button className="wl-item-next-save" onClick={() => handleSaveNextAction(item.id)} disabled={savingNextActionId === item.id}>
                        {savingNextActionId === item.id ? '…' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <div className="wl-item-next">
                      {item.next_action ? <>→ {item.next_action}</> : null}
                      <button className="wl-item-next-edit-btn" onClick={() => handleStartEditNextAction(item.id, item.next_action)} title="Edit next action">
                        {item.next_action ? '✎' : '+ next action'}
                      </button>
                    </div>
                  )}
                  <div className="wl-item-actions">
                    <button
                      className="wl-item-action-btn wl-item-action-btn--resolve"
                      onClick={() => handleResolve(item.id)}
                      disabled={!!resolvingId}
                      title="Mark as resolved"
                    >
                      {resolvingId === item.id ? '…' : '✓ Resolve'}
                    </button>
                    <button
                      className="wl-item-action-btn wl-item-action-btn--snooze"
                      onClick={() => handleSnooze(item.id)}
                      disabled={!!snoozingId}
                      title="Snooze for 7 days"
                    >
                      {snoozingId === item.id ? '…' : '◷ Snooze 7d'}
                    </button>
                  </div>
                </div>
                {typeof item.confidence_pct === 'number' && (
                  <div className="wl-item-conf">{item.confidence_pct}%</div>
                )}
                <button
                  className="wl-item-remove"
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  aria-label={`Remove ${item.title} from watchlist`}
                  title="Remove from watchlist"
                >
                  {removingId === item.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="wl-empty">
          <div className="wl-empty-icon">◈</div>
          <div className="wl-empty-title">Your watchlist is empty</div>
          <p className="wl-empty-body">
            Save markets, signals, and counterparties to track them across sessions.
            Harbourview will surface relevant changes and notify you when watched markets move.
          </p>
          <div className="wl-feature-grid">
            {[
              { icon: '◷', label: 'Regulatory Alerts',    desc: 'Get notified when watched markets change regulatory status.' },
              { icon: '≋',  label: 'Signal Notifications', desc: 'Weekly intelligence signals for markets you follow.'        },
              { icon: '⊞',  label: 'Listing Matches',      desc: 'New listings matching your role and region profile.'         },
              { icon: '◉',  label: 'Local Intel Updates',  desc: 'Priority coverage updates for your watched markets.'        },
            ].map(f => (
              <div key={f.label} className="wl-feature-card">
                <div className="wl-feature-icon">{f.icon}</div>
                <div className="wl-feature-label">{f.label}</div>
                <div className="wl-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
          <div className="wl-cta-group">
            <a href="/intake" className="wl-cta-gold">Upgrade for Watchlist Access →</a>
            <a href="/intelligence" className="wl-cta-outline">Browse Markets to Add</a>
          </div>
        </div>
      )}

      {/* Watch rule builder */}
      <div className="wl-rules">
        <div className="wl-section-head">WATCH RULES ({rules.length})</div>

        {/* Existing rules */}
        {rules.length > 0 && (
          <div className="wl-rule-list">
            {rules.map(rule => (
              <div key={rule.id} className={`wl-rule${rule.is_active ? '' : ' wl-rule--off'}`}>
                <div className="wl-rule-body">
                  <span className="wl-rule-type">{RULE_TYPE_LABELS[rule.rule_type] ?? rule.rule_type}</span>
                  {rule.keywords.length > 0 && (
                    <div className="wl-rule-keywords">
                      {rule.keywords.map(k => (
                        <span key={k} className="wl-rule-kw">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="wl-rule-actions">
                  <button
                    className={`wl-rule-toggle${rule.is_active ? ' wl-rule-toggle--on' : ''}`}
                    onClick={() => handleToggleRule(rule)}
                    disabled={togglingRuleId === rule.id}
                    title={rule.is_active ? 'Pause rule' : 'Activate rule'}
                  >
                    {togglingRuleId === rule.id ? '…' : rule.is_active ? 'Active' : 'Paused'}
                  </button>
                  <button
                    className="wl-rule-delete"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deletingRuleId === rule.id}
                    title="Delete rule"
                    aria-label="Delete rule"
                  >
                    {deletingRuleId === rule.id ? '…' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new rule form */}
        <form className="wl-rule-form" onSubmit={handleAddRule}>
          <div className="wl-rule-form-head">Add watch rule</div>
          <div className="wl-rule-form-row">
            <select
              className="wl-rule-select"
              value={ruleType}
              onChange={e => setRuleType(e.target.value)}
              aria-label="Rule type"
            >
              {RULE_TYPES.map(t => (
                <option key={t} value={t}>{RULE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="wl-rule-form-row">
            <input
              className="wl-rule-input"
              type="text"
              value={ruleKeywords}
              onChange={e => setRuleKeywords(e.target.value)}
              placeholder="Keywords, comma-separated (e.g. Germany, import licence)"
              aria-label="Keywords"
            />
          </div>
          <button
            type="submit"
            className="wl-rule-submit"
            disabled={ruleState === 'saving'}
          >
            {ruleState === 'saving' ? 'Saving…' : ruleState === 'error' ? 'Error — retry' : '+ Add rule'}
          </button>
          <p className="wl-rule-hint">
            Rules trigger alerts when matching signals, listings, or regulatory changes are detected for your watched context.
            Persistence requires an authenticated operator session.
          </p>
        </form>
      </div>
    </div>
  )
})

const CSS = `
:root { --wl-gold: #d4a84b; }
.wl-root {
  display:flex;flex-direction:column;height:100%;overflow-y:auto;
  padding:0 0 32px;animation:wlIn .28s ease;
}
@keyframes wlIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.wl-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;gap:16px;flex-shrink:0;
}
.wl-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.wl-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }

.wl-cta-gold {
  display:inline-flex;align-items:center;padding:9px 18px;border-radius:8px;
  font-size:12px;font-weight:600;background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;transition:opacity .12s;
}
.wl-cta-gold:hover { opacity:.88; }
.wl-cta-outline {
  display:inline-flex;align-items:center;padding:8px 14px;border-radius:8px;font-size:11px;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);
  color:rgba(245,240,232,.55);text-decoration:none;flex-shrink:0;
  transition:background .12s,color .12s;
}
.wl-cta-outline:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

.wl-current { padding:16px 24px 0; }
.wl-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);margin-bottom:10px;
}
.wl-current-card {
  display:flex;align-items:center;gap:12px;
  padding:14px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);
  max-width:480px;
}
.wl-current-flag { font-size:24px;flex-shrink:0; }
.wl-current-info { flex:1;min-width:0; }
.wl-current-name  { font-size:13px;font-weight:600;color:#f5f0e8; }
.wl-current-label { font-size:10px;color:rgba(245,240,232,.35);margin-top:2px; }
.wl-add-btn {
  font-size:11px;padding:6px 12px;border-radius:7px;
  border:1px solid rgba(212,168,75,.3);background:rgba(212,168,75,.06);
  color:#d4a84b;cursor:pointer;font:inherit;flex-shrink:0;
  transition:background .12s,color .12s,border-color .12s;
}
.wl-add-btn:hover:not(:disabled) { background:rgba(212,168,75,.14); }
.wl-add-btn:disabled { opacity:.6;cursor:default; }
.wl-add-btn--saved { border-color:rgba(76,175,130,.4);background:rgba(76,175,130,.1);color:#4caf82; }

.wl-notifs { padding:12px 24px 0; }
.wl-notif-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:420px; }
.wl-notif-cell { padding:10px 8px;border-radius:10px;text-align:center;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07); }
.wl-notif-val { display:block;font-size:18px;font-weight:700;line-height:1; }
.wl-notif-label { display:block;font-size:9px;color:rgba(245,240,232,.4);margin-top:3px;letter-spacing:.03em; }

.wl-items { padding:16px 24px 0; }
.wl-item-list { display:flex;flex-direction:column;gap:8px; }
.wl-item {
  display:flex;align-items:flex-start;gap:12px;
  padding:13px 14px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
}
.wl-item-icon { font-size:17px;flex-shrink:0;margin-top:1px; }
.wl-item-body { flex:1;min-width:0;display:flex;flex-direction:column;gap:3px; }
.wl-item-top { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
.wl-item-title { font-size:12.5px;font-weight:600;color:#f5f0e8; }
.wl-item-tag {
  font-size:9px;letter-spacing:.06em;text-transform:uppercase;
  padding:1px 6px;border-radius:4px;
  background:rgba(212,168,75,.1);border:1px solid rgba(212,168,75,.25);color:#d4a84b;
}
.wl-item-tag--muted { background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08);color:rgba(245,240,232,.45); }
.wl-item-sub { font-size:11px;color:rgba(245,240,232,.45); }
.wl-item-change { font-size:10.5px;color:rgba(245,240,232,.5); }
.wl-item-time { color:rgba(245,240,232,.3); }
.wl-item-next-static { font-size:10.5px;color:#5b9bd5; }
.wl-item-conf { font-size:13px;font-weight:700;color:#d4a84b;flex-shrink:0;padding:4px 8px;border-radius:6px;background:rgba(212,168,75,.08); }
.wl-item-remove {
  flex-shrink:0;width:22px;height:22px;border-radius:6px;
  border:1px solid rgba(255,255,255,.08);background:transparent;
  color:rgba(245,240,232,.3);font-size:11px;cursor:pointer;font:inherit;
  display:flex;align-items:center;justify-content:center;
  transition:background .12s,color .12s,border-color .12s;
}
.wl-item-remove:hover:not(:disabled) { background:rgba(220,80,80,.1);border-color:rgba(220,80,80,.3);color:#e08080; }
.wl-item-remove:disabled { opacity:.5;cursor:default; }

.wl-item-actions { display:flex;align-items:center;gap:4px;margin-top:5px; }
.wl-item-action-btn {
  font-size:9.5px;padding:2px 8px;border-radius:5px;cursor:pointer;font:inherit;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.45);transition:all .12s;
}
.wl-item-action-btn:hover:not(:disabled) { background:rgba(255,255,255,.08);color:#f5f0e8; }
.wl-item-action-btn--resolve:hover:not(:disabled) { border-color:rgba(76,175,130,.35);background:rgba(76,175,130,.08);color:#4caf82; }
.wl-item-action-btn--snooze:hover:not(:disabled) { border-color:rgba(91,155,213,.35);background:rgba(91,155,213,.08);color:#5b9bd5; }
.wl-item-action-btn:disabled { opacity:.4;cursor:default; }

.wl-item-next { display:flex;align-items:center;gap:4px;font-size:10.5px;color:#5b9bd5; }
.wl-item-next-edit-btn {
  font-size:9px;padding:1px 5px;border-radius:4px;cursor:pointer;font:inherit;
  border:1px solid rgba(255,255,255,.08);background:transparent;
  color:rgba(245,240,232,.25);transition:all .12s;
}
.wl-item-next-edit-btn:hover { color:rgba(245,240,232,.6);border-color:rgba(255,255,255,.2); }
.wl-item-next-edit { display:flex;align-items:center;gap:5px;margin-top:3px; }
.wl-item-next-input {
  flex:1;font:inherit;font-size:10.5px;color:#5b9bd5;background:rgba(255,255,255,.04);
  border:1px solid rgba(91,155,213,.3);border-radius:5px;padding:2px 7px;outline:none;
}
.wl-item-next-input:focus { border-color:rgba(91,155,213,.55); }
.wl-item-next-save {
  font-size:9.5px;padding:2px 8px;border-radius:5px;cursor:pointer;font:inherit;
  border:1px solid rgba(76,175,130,.3);background:rgba(76,175,130,.08);color:#4caf82;
  transition:all .12s;
}
.wl-item-next-save:disabled { opacity:.5;cursor:default; }

.wl-empty {
  display:flex;flex-direction:column;align-items:center;
  text-align:center;gap:16px;padding:40px 24px;
}
.wl-empty-icon  { font-size:32px;color:rgba(212,168,75,.35); }
.wl-empty-title { font-family:'Georgia',serif;font-size:20px;font-weight:400;color:#f5f0e8; }
.wl-empty-body  { font-size:12px;color:rgba(245,240,232,.42);max-width:440px;line-height:1.7; }

.wl-feature-grid {
  display:grid;grid-template-columns:repeat(2,1fr);gap:10px;
  width:100%;max-width:540px;margin:4px 0;
}
.wl-feature-card {
  padding:14px;border-radius:10px;text-align:left;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
}
.wl-feature-icon  { font-size:18px;margin-bottom:7px; }
.wl-feature-label { font-size:11px;font-weight:600;color:#f5f0e8;margin-bottom:4px; }
.wl-feature-desc  { font-size:10px;color:rgba(245,240,232,.4);line-height:1.5; }
.wl-cta-group { display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:4px; }

/* Watch rules */
.wl-rules { padding:20px 24px 0; }
.wl-rule-list { display:flex;flex-direction:column;gap:6px;margin-bottom:14px; }
.wl-rule {
  display:flex;align-items:center;gap:10px;
  padding:11px 13px;border-radius:9px;
  background:rgba(255,255,255,.025);border:1px solid rgba(212,168,75,.18);
}
.wl-rule--off { opacity:.5;border-color:rgba(255,255,255,.07); }
.wl-rule-body { flex:1;min-width:0;display:flex;flex-direction:column;gap:5px; }
.wl-rule-type { font-size:12px;font-weight:600;color:#f5f0e8; }
.wl-rule-keywords { display:flex;flex-wrap:wrap;gap:4px; }
.wl-rule-kw {
  font-size:9.5px;padding:1px 7px;border-radius:4px;
  background:rgba(91,155,213,.1);border:1px solid rgba(91,155,213,.25);color:#5b9bd5;
}
.wl-rule-actions { display:flex;align-items:center;gap:6px;flex-shrink:0; }
.wl-rule-toggle {
  font-size:10px;padding:4px 9px;border-radius:6px;cursor:pointer;font:inherit;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.45);transition:all .12s;
}
.wl-rule-toggle--on { border-color:rgba(76,175,130,.35);background:rgba(76,175,130,.08);color:#4caf82; }
.wl-rule-toggle:hover:not(:disabled) { opacity:.8; }
.wl-rule-toggle:disabled { opacity:.5;cursor:default; }
.wl-rule-delete {
  width:22px;height:22px;border-radius:6px;
  border:1px solid rgba(255,255,255,.08);background:transparent;
  color:rgba(245,240,232,.3);font-size:11px;cursor:pointer;font:inherit;
  display:flex;align-items:center;justify-content:center;
  transition:background .12s,color .12s,border-color .12s;
}
.wl-rule-delete:hover:not(:disabled) { background:rgba(220,80,80,.1);border-color:rgba(220,80,80,.3);color:#e08080; }
.wl-rule-delete:disabled { opacity:.5;cursor:default; }

.wl-rule-form {
  padding:14px;border-radius:10px;
  background:rgba(255,255,255,.018);border:1px solid rgba(255,255,255,.08);
  display:flex;flex-direction:column;gap:10px;max-width:520px;
}
.wl-rule-form-head { font-size:11px;font-weight:600;color:rgba(245,240,232,.6);letter-spacing:.03em; }
.wl-rule-form-row { display:flex;gap:8px; }
.wl-rule-select,.wl-rule-input {
  flex:1;padding:8px 10px;border-radius:7px;font:inherit;font-size:12px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  color:#f5f0e8;outline:none;
}
.wl-rule-select:focus,.wl-rule-input:focus { border-color:rgba(212,168,75,.4); }
.wl-rule-select option { background:#0d1117;color:#f5f0e8; }
.wl-rule-submit {
  align-self:flex-start;padding:7px 16px;border-radius:7px;
  font-size:11.5px;font-weight:600;cursor:pointer;font:inherit;
  border:1px solid rgba(212,168,75,.35);background:rgba(212,168,75,.08);
  color:#d4a84b;transition:background .12s;
}
.wl-rule-submit:hover:not(:disabled) { background:rgba(212,168,75,.16); }
.wl-rule-submit:disabled { opacity:.6;cursor:default; }
.wl-rule-hint { font-size:10px;color:rgba(245,240,232,.3);line-height:1.5;margin:0; }
`
