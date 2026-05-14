'use client';

import { useEffect, useState } from 'react';
import type { HubIssue, HubServiceHealth, HubSnapshot } from '@/lib/ops-hub/types';

type HubTab = 'context' | 'issues' | 'stack' | 'prompts';
type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: HubSnapshot }
  | { status: 'error'; error: string };

function serviceBadge(service: HubServiceHealth) {
  const label = service.status === 'ready' ? 'Ready' : service.status === 'missing_env' ? 'Missing env' : 'Error';
  const tone = service.status === 'ready' ? 'border-emerald-400/30 text-emerald-200' : 'border-amber-400/35 text-amber-200';
  return <span className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.18em] ${tone}`}>{label}</span>;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/10">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#C6A55A]">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">{children}</div>
    </section>
  );
}

function PreText({ value, emptyLabel }: { value: string; emptyLabel: string }) {
  if (!value.trim()) return <p className="text-[#F5F1E8]/45">{emptyLabel}</p>;
  return <pre className="max-h-[32rem] whitespace-pre-wrap break-words rounded-xl bg-black/25 p-4 text-xs leading-5 text-[#F5F1E8]/80">{value}</pre>;
}

function IssuesTable({ issues }: { issues: HubIssue[] }) {
  if (!issues.length) return <p className="text-[#F5F1E8]/45">No Linear issues are available from the read-only hub context endpoint.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-white/[0.06] text-[#F5F1E8]/55">
          <tr>
            <th className="px-3 py-3 font-medium">Issue</th>
            <th className="px-3 py-3 font-medium">Priority</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Title</th>
            <th className="px-3 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="border-t border-white/10 text-[#F5F1E8]/75">
              <td className="px-3 py-3 font-mono text-[#C6A55A]">
                <a href={issue.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {issue.identifier}
                </a>
              </td>
              <td className="px-3 py-3">{issue.priorityLabel}</td>
              <td className="px-3 py-3">{issue.status}</td>
              <td className="px-3 py-3">{issue.title}</td>
              <td className="px-3 py-3">{new Date(issue.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminHubClient({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState<HubTab>('context');
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  async function loadSnapshot() {
    setLoadState({ status: 'loading' });
    try {
      const response = await fetch('/api/admin/hub/context', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || `Hub context request failed with ${response.status}`);
      setLoadState({ status: 'ready', data: payload as HubSnapshot });
    } catch (error) {
      setLoadState({ status: 'error', error: error instanceof Error ? error.message : 'Unknown hub context error' });
    }
  }

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const snapshot = loadState.status === 'ready' ? loadState.data : null;
  const services = snapshot
    ? [
        ['Shared memory', snapshot.services.notionSharedMemory] as const,
        ['Stack', snapshot.services.notionStack] as const,
        ['Prompt library', snapshot.services.notionPromptLibrary] as const,
        ['Linear', snapshot.services.linear] as const,
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1828] p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Read-only control surface</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F5F1E8]">Intelligence Operations Hub</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#F5F1E8]/65">
              Internal admin/operator view for Harbourview context, Linear execution state, stack notes, and prompt library references. Writes, decision promotion, and Linear mutation are disabled in this first PR.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-[#F5F1E8]/60">
            <div className="font-mono text-[#F5F1E8]/85">{userEmail}</div>
            <div className="mt-2">Mode: read-only</div>
            <button type="button" onClick={() => void loadSnapshot()} className="mt-4 rounded-full border border-[#C6A55A]/45 px-4 py-2 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">
              Refresh context
            </button>
          </div>
        </div>

        {snapshot ? (
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {services.map(([label, service]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#F5F1E8]/70">{label}</span>
                  {serviceBadge(service)}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#F5F1E8]/45">{service.message}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {([
          ['context', 'Context'],
          ['issues', 'Linear issues'],
          ['stack', 'Stack'],
          ['prompts', 'Prompt library'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full border px-4 py-2 text-sm transition ${tab === id ? 'border-[#C6A55A] bg-[#C6A55A]/10 text-[#C6A55A]' : 'border-white/10 text-[#F5F1E8]/60 hover:border-[#C6A55A]/45 hover:text-[#C6A55A]'}`}>
            {label}
          </button>
        ))}
      </div>

      {loadState.status === 'loading' ? <SectionCard title="Loading">Reading internal hub context from server-only sources.</SectionCard> : null}
      {loadState.status === 'error' ? <SectionCard title="Hub unavailable"><p>{loadState.error}</p></SectionCard> : null}

      {snapshot && tab === 'context' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Active context"><PreText value={snapshot.sections.activeContext} emptyLabel="No active context section was returned." /></SectionCard>
          <SectionCard title="Current task"><PreText value={snapshot.sections.currentTask} emptyLabel="No current task section was returned." /></SectionCard>
          <SectionCard title="Confirmed decisions"><PreText value={snapshot.sections.confirmedDecisions} emptyLabel="No confirmed decisions section was returned." /></SectionCard>
          <SectionCard title="Open questions / handoff"><PreText value={[snapshot.sections.openQuestions, snapshot.sections.handoffQueue].filter(Boolean).join('\n\n')} emptyLabel="No open questions or handoff queue section was returned." /></SectionCard>
        </div>
      ) : null}

      {snapshot && tab === 'issues' ? <SectionCard title="Linear project issues"><IssuesTable issues={snapshot.issues} /></SectionCard> : null}
      {snapshot && tab === 'stack' ? <SectionCard title="Stack reference"><PreText value={snapshot.stack} emptyLabel="No stack page content was returned." /></SectionCard> : null}
      {snapshot && tab === 'prompts' ? <SectionCard title="Prompt library"><PreText value={snapshot.promptLibrary} emptyLabel="No prompt library content was returned." /></SectionCard> : null}
    </div>
  );
}
