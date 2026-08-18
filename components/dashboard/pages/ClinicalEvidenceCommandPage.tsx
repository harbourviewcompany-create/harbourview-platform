/**
 * Clinical Evidence Command — Command Centre page
 * Self-loads jurisdiction briefing, pathway, and evidence fixtures.
 * Not medical advice. Evidence distinct from marketing/genetics.
 */
"use client";

import React, { useEffect, useState, useTransition } from "react";
import type {
  EvidenceRecord,
  JurisdictionBriefing,
  ProfessionalPathway,
  WhatChangedEvent,
  ClinicalAttentionItem,
  ClinicalNextAction,
} from "@/lib/clinical/types";
import { loadClinicalPageData } from "@/lib/clinical/clinicalQuery";
import { searchEvidence } from "@/lib/fixtures/clinical/evidence";

export type ClinicalEvidenceCommandPageProps = {
  countryLabel: string;
  countryIso2?: string | null;
  roleLabel?: string;
};

const card = "bg-[#161b22] border border-white/8 rounded-xl";
const muted = "text-white/55";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]/80">
      {children}
    </div>
  );
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "ready" | "loaded" | "empty" | "attention" | "neutral";
}) {
  const tones = {
    ready: "bg-emerald-500/15 text-emerald-400",
    loaded: "bg-[#d4a853]/15 text-[#d4a853]",
    empty: "bg-white/8 text-white/50",
    attention: "bg-amber-500/15 text-amber-400",
    neutral: "bg-white/8 text-white/60",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[tone]}`}>
      {label}
    </span>
  );
}

function PrimaryLink({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#d4a853] hover:text-[#e0b96a] transition-colors";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function StrengthBadge({ strength }: { strength: EvidenceRecord["strength"] }) {
  const map: Record<EvidenceRecord["strength"], string> = {
    high: "bg-emerald-500/20 text-emerald-400",
    moderate: "bg-sky-500/20 text-sky-400",
    low: "bg-amber-500/20 text-amber-400",
    very_low: "bg-orange-500/20 text-orange-400",
    insufficient: "bg-white/10 text-white/50",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[strength]}`}>
      {strength.replace("_", " ")}
    </span>
  );
}

function EvidenceCard({ record }: { record: EvidenceRecord }) {
  return (
    <article className={`${card} p-4 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-white/90 leading-snug">{record.title}</h3>
        <StrengthBadge strength={record.strength} />
      </div>
      <p className={`text-xs ${muted}`}>
        {record.condition} · {record.cannabinoidFocus.join(", ")}
        {record.route ? ` · ${record.route}` : ""}
      </p>
      <p className={`text-sm leading-relaxed ${muted}`}>{record.summary}</p>
      {record.keyFindings.length > 0 && (
        <ul className="mt-1 space-y-1">
          {record.keyFindings.slice(0, 3).map((f, i) => (
            <li key={i} className={`text-xs leading-relaxed ${muted}`}>· {f}</li>
          ))}
        </ul>
      )}
      <div className={`pt-2 text-[11px] ${muted} border-t border-white/6`}>
        Source: {record.sourceCitation} · Reviewed {record.reviewedAt.slice(0, 10)}
        {record.applicabilityNotes && (
          <p className="mt-1 text-amber-400/80">{record.applicabilityNotes}</p>
        )}
      </div>
    </article>
  );
}

export default function ClinicalEvidenceCommandPage({
  countryLabel,
  countryIso2 = "BR",
  roleLabel = "All roles",
}: ClinicalEvidenceCommandPageProps) {
  const iso2 = (countryIso2 || "BR").toUpperCase();
  const [briefing, setBriefing] = useState<JurisdictionBriefing | null>(null);
  const [pathway, setPathway] = useState<ProfessionalPathway | null>(null);
  const [results, setResults] = useState<EvidenceRecord[]>([]);
  const [whatChanged, setWhatChanged] = useState<WhatChangedEvent[]>([]);
  const [attention, setAttention] = useState<ClinicalAttentionItem[]>([]);
  const [nextActions, setNextActions] = useState<ClinicalNextAction[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadClinicalPageData(iso2, roleLabel).then((data) => {
      if (cancelled) return;
      setBriefing(data.briefing);
      setPathway(data.pathway);
      setResults(data.evidence);
      setWhatChanged(data.whatChanged);
      setAttention(data.attention);
      setNextActions(data.nextActions);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [iso2, roleLabel]);

  const filters = [
    "Evidence",
    "Safety",
    "Interactions",
    "Formulations",
    "Guidelines",
    "Practice",
    "Monitoring",
  ];
  const domainMap: Record<string, string> = {
    Evidence: "efficacy",
    Safety: "safety",
    Interactions: "interactions",
    Formulations: "formulations",
    Guidelines: "guidelines",
    Practice: "practice",
    Monitoring: "monitoring",
  };

  const runSearch = (q: string, filter: string | null) => {
    startTransition(() => {
      const domain = filter ? domainMap[filter] : undefined;
      setResults(searchEvidence(q, { domain, jurisdiction: iso2 }));
      setSearched(true);
    });
  };

  const evidenceCount = results.length;
  const showEmpty = !loading && (searched ? evidenceCount === 0 : evidenceCount === 0 && !query);

  if (loading) {
    return (
      <div className="p-4 text-sm text-white/50">Loading clinical command…</div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <section className={`${card} p-4`}>
        <SectionLabel>Clinical</SectionLabel>
        <h2 className="text-xl font-semibold leading-snug text-white">
          Professional clinical command
        </h2>
        <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
          Reviewed cannabinoid and medical-cannabis clinical reference for medical
          professionals. Evidence and regulatory status stay distinct from product
          marketing and genetics. Not a general medicines monograph service.
        </p>
      </section>

      <section className={`${card} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Evidence command · {countryLabel}</SectionLabel>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`text-sm ${muted}`}>{roleLabel}</span>
              <StatusBadge
                label={evidenceCount > 0 ? "Ready" : "No records"}
                tone={evidenceCount > 0 ? "ready" : "empty"}
              />
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query, activeFilter);
          }}
          className="mt-4"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a condition or clinical question…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#d4a853]/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/30"
          />
        </form>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => {
            const active = activeFilter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  const next = activeFilter === f ? null : f;
                  setActiveFilter(next);
                  if (query.trim() || searched) runSearch(query, next);
                }}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#d4a853]/20 text-[#d4a853]"
                    : "bg-white/6 text-white/60 hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          {isPending && <p className={`text-sm ${muted}`}>Searching reviewed evidence…</p>}
          {!isPending && showEmpty && (
            <div className="rounded-lg bg-white/[0.03] px-3.5 py-4">
              <p className="text-sm font-medium text-white/80">
                {searched
                  ? "No matching reviewed records"
                  : "0 reviewed records for this context"}
              </p>
              <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
                Enter a condition or clinical question to search reviewed evidence.
                This is a cannabinoid & medical-cannabis clinical reference only —
                not a general medicines monograph service. Not patient-specific advice.
              </p>
            </div>
          )}
          {!isPending && evidenceCount > 0 && (
            <>
              <p className={`text-xs ${muted}`}>
                {evidenceCount} reviewed record{evidenceCount === 1 ? "" : "s"}
                {searched ? " matching your search" : ""}
              </p>
              {results.map((r) => (
                <EvidenceCard key={r.id} record={r} />
              ))}
            </>
          )}
        </div>
      </section>

      {briefing && (
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Jurisdiction briefing · {briefing.country}</SectionLabel>
            <StatusBadge label="Loaded" tone="loaded" />
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${muted}`}>{briefing.summary}</p>
          <p className={`mt-2 text-xs ${muted}`}>
            Primary authority: {briefing.primaryAuthority.name}
            {briefing.professionalRegulator &&
              ` · Regulator: ${briefing.professionalRegulator.name}`}
          </p>
          <p className={`mt-1 text-xs ${muted}`}>
            Verify material clinical decisions against the cited primary authority.
            Last reviewed {briefing.lastReviewed}.
          </p>
          {briefing.primaryAuthority.url && (
            <PrimaryLink href={briefing.primaryAuthority.url}>Open primary source ↗</PrimaryLink>
          )}
        </section>
      )}

      <section className={`${card} p-4`}>
        <SectionLabel>What changed</SectionLabel>
        {whatChanged.length === 0 ? (
          <p className={`text-sm leading-relaxed ${muted}`}>
            No reviewed material-change record is available for this context. This does
            not mean nothing has changed externally — only that no reviewed change event
            has been published here yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {whatChanged.map((ev) => (
              <li key={ev.id}>
                <p className="text-sm font-medium text-white/90">{ev.title}</p>
                <p className={`mt-0.5 text-sm ${muted}`}>{ev.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} p-4`}>
        <SectionLabel>What requires attention</SectionLabel>
        <ul className="mt-2 space-y-3">
          {attention.map((item) => (
            <li key={item.id}>
              <p className="text-sm font-medium text-white/90">{item.title}</p>
              <p className={`mt-0.5 text-sm leading-relaxed ${muted}`}>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} p-4`}>
        <SectionLabel>What can I do next</SectionLabel>
        {nextActions.map((action) => (
          <div key={action.id} className="mt-2">
            <p className="text-sm font-medium text-white/90">{action.title}</p>
            <p className={`mt-1 text-sm leading-relaxed ${muted}`}>{action.body}</p>
            <PrimaryLink href={action.primaryActionUrl}>{action.primaryActionLabel}</PrimaryLink>
          </div>
        ))}
      </section>

      {briefing && (
        <section className={`${card} p-4`}>
          <SectionLabel>Jurisdiction pathway</SectionLabel>
          <p className="text-sm font-medium text-white/90">{briefing.legalPathway}</p>
          <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{briefing.accessNotes}</p>
        </section>
      )}

      {pathway && (
        <section className={`${card} p-4`}>
          <SectionLabel>Professional pathway</SectionLabel>
          <p className={`text-xs ${muted}`}>{pathway.roles}</p>
          <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
            {pathway.whoMayPrescribe}{" "}
            {pathway.conditionsMentioned.length > 0 && (
              <>
                Conditions commonly considered include{" "}
                {pathway.conditionsMentioned.join(", ")}.
              </>
            )}
          </p>
          {pathway.restrictions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {pathway.restrictions.map((r, i) => (
                <li key={i} className={`text-xs ${muted}`}>· {r}</li>
              ))}
            </ul>
          )}
          <p className={`mt-2 text-xs ${muted}`}>{pathway.notes}</p>
        </section>
      )}
    </div>
  );
}
