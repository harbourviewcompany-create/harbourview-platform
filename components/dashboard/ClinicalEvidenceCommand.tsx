/**
 * Harbourview — Clinical Evidence Command (redesigned)
 * Clean, clinician-grade layout. Fixes concatenated strings,
 * empty states, hierarchy and spacing.
 *
 * Drop into components/dashboard/ or the Clinical page.
 * Design tokens: dark navy surfaces, gold accents, high contrast text.
 */

"use client";

import React, { useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Status = "ready" | "empty" | "loaded" | "attention";

interface ClinicalEvidenceCommandProps {
  country: string;           // e.g. "Brazil"
  countryFlag?: string;      // e.g. "🇧🇷"
  roleLabel?: string;        // e.g. "All roles"
  evidenceCount?: number;    // 0 when empty
  jurisdictionLoaded?: boolean;
  onOpenWorkspace?: () => void;
  onOpenPrimarySource?: () => void;
  onJurisdictionCommand?: () => void;
  onSearch?: (query: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Design tokens (match existing Harbourview dark + gold)                    */
/* -------------------------------------------------------------------------- */

const surface = "bg-[#0f1419]";
const card = "bg-[#161b22] border border-white/8";
const gold = "text-[#d4a853]";
const goldBg = "bg-[#d4a853]/10";
const muted = "text-white/55";
const strong = "text-white/90";

/* -------------------------------------------------------------------------- */
/*  Small primitives                                                          */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; className: string }> = {
    ready:     { label: "Ready",     className: "bg-emerald-500/15 text-emerald-400" },
    empty:     { label: "No records", className: "bg-white/8 text-white/50" },
    loaded:    { label: "Loaded",    className: "bg-[#d4a853]/15 text-[#d4a853]" },
    attention: { label: "Attention", className: "bg-amber-500/15 text-amber-400" },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${className}`}>
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]/80">
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl ${card} p-4 ${className}`}>
      {children}
    </div>
  );
}

function PrimaryLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#d4a853] hover:text-[#e0b96a] transition-colors"
    >
      {children}
      <span aria-hidden>→</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function ClinicalEvidenceCommand({
  country = "Brazil",
  countryFlag = "🇧🇷",
  roleLabel = "All roles",
  evidenceCount = 0,
  jurisdictionLoaded = true,
  onOpenWorkspace,
  onOpenPrimarySource,
  onJurisdictionCommand,
  onSearch,
}: ClinicalEvidenceCommandProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filters = [
    "Evidence",
    "Safety",
    "Interactions",
    "Formulations",
    "Guidelines",
    "Practice",
    "Monitoring",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query.trim());
  };

  return (
    <div className={`min-h-screen ${surface} text-white`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-white/6 bg-[#0f1419]/95 backdrop-blur-md px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Command</h1>
        </div>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-left text-sm text-white/80"
        >
          <span>{countryFlag}</span>
          <span>{country} · {roleLabel}</span>
          <span className="ml-auto text-white/40">▼</span>
        </button>

        {/* Tabs */}
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {["Genetics", "Talent", "Clinical", "Compliance", "Education"].map((tab) => {
            const active = tab === "Clinical";
            return (
              <button
                key={tab}
                type="button"
                className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#d4a853]/20 text-[#d4a853]"
                    : "text-white/55 hover:text-white/80"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="space-y-4 px-4 py-5 pb-28">
        {/* ── Professional clinical command ────────────────────────────── */}
        <Card>
          <SectionLabel>Clinical</SectionLabel>
          <h2 className="text-xl font-semibold leading-snug text-white">
            Professional clinical command
          </h2>
          <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
            Reviewed cannabinoid and medical-cannabis clinical reference for medical
            professionals. Evidence and regulatory status stay distinct from product
            marketing and genetics. Not a general medicines monograph service.
          </p>
          <PrimaryLink onClick={onOpenWorkspace}>
            Open clinician workspace
          </PrimaryLink>
        </Card>

        {/* ── Evidence command ─────────────────────────────────────────── */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionLabel>Evidence command · {country}</SectionLabel>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-sm ${muted}`}>{roleLabel}</span>
                <StatusBadge status={evidenceCount > 0 ? "ready" : "empty"} />
              </div>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-4">
            <label className="sr-only" htmlFor="clinical-search">
              Search evidence
            </label>
            <input
              id="clinical-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a condition or clinical question…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#d4a853]/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/30"
            />
          </form>

          {/* Filter chips — never concatenated */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filters.map((f) => {
              const active = activeFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(active ? null : f)}
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

          {/* Empty / results state */}
          <div className="mt-5 rounded-lg bg-white/[0.03] px-3.5 py-4">
            {evidenceCount === 0 ? (
              <>
                <p className="text-sm font-medium text-white/80">
                  0 reviewed records for this context
                </p>
                <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
                  Enter a condition or clinical question to search reviewed evidence.
                  This is a cannabinoid & medical-cannabis clinical reference only —
                  not a general medicines monograph service. Not patient-specific advice.
                </p>
              </>
            ) : (
              <p className="text-sm text-white/80">
                {evidenceCount} reviewed record{evidenceCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </Card>

        {/* ── Jurisdiction briefing ────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Jurisdiction briefing · {country}</SectionLabel>
            {jurisdictionLoaded && <StatusBadge status="loaded" />}
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${muted}`}>
            Jurisdiction briefing loaded. Verify material clinical decisions against
            the cited primary authority for this country. Cannabinoid / medical-cannabis
            clinical reference only — not general prescribing across all drug classes.
          </p>
          <PrimaryLink>View full briefing</PrimaryLink>
        </Card>

        {/* ── What changed ─────────────────────────────────────────────── */}
        <Card>
          <SectionLabel>What changed</SectionLabel>
          <p className={`text-sm leading-relaxed ${muted}`}>
            No reviewed material-change record is available for this context. This does
            not mean nothing has changed externally — only that no reviewed change event
            has been published here yet.
          </p>
        </Card>

        {/* ── What requires attention ──────────────────────────────────── */}
        <Card>
          <SectionLabel>What requires attention</SectionLabel>
          <ul className="mt-2 space-y-3">
            <li>
              <p className="text-sm font-medium text-white/90">Verify against source</p>
              <p className={`mt-0.5 text-sm leading-relaxed ${muted}`}>
                Jurisdiction briefing is present; confirm material decisions against the
                cited authority and professional regulator.
              </p>
            </li>
            <li>
              <p className="text-sm font-medium text-white/90">Inspect applicability</p>
              <p className={`mt-0.5 text-sm leading-relaxed ${muted}`}>
                Confirm population, formulation, jurisdiction, professional scope and
                source date before relying on a record.
              </p>
            </li>
          </ul>
        </Card>

        {/* ── What can I do next ───────────────────────────────────────── */}
        <Card>
          <SectionLabel>What can I do next</SectionLabel>
          <p className="text-sm font-medium text-white/90">
            Cannabis products authorization
          </p>
          <p className={`mt-1 text-sm leading-relaxed ${muted}`}>
            ANVISA regulates cannabis-derived products and import authorization.
          </p>
          <PrimaryLink onClick={onOpenPrimarySource}>
            Open primary source ↗
          </PrimaryLink>
        </Card>

        {/* ── Jurisdiction pathway ─────────────────────────────────────── */}
        <Card>
          <SectionLabel>Jurisdiction pathway</SectionLabel>
          <p className="text-sm font-medium text-white/90">
            Medical Legal (CBD and THC Products); No Adult-Use
          </p>
          <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
            Patients access cannabis through physician prescription of authorized
            products. Cost remains a barrier for lower-income patients, though
            government reimbursement discussions are ongoing.
          </p>
          <PrimaryLink onClick={onJurisdictionCommand}>
            Jurisdiction command
          </PrimaryLink>
        </Card>

        {/* ── Professional pathway ─────────────────────────────────────── */}
        <Card>
          <SectionLabel>Professional pathway</SectionLabel>
          <p className={`text-xs ${muted}`}>{roleLabel}</p>
          <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
            Physicians registered with the Conselho Federal de Medicina may prescribe
            authorized cannabis products for conditions including epilepsy, chronic pain,
            Parkinson&apos;s disease, anxiety, and others. Prescriptions must specify
            approved products. No specialist-only restriction applies though complexity
            of conditions may direct patients to specialists.
          </p>
          <PrimaryLink onClick={onOpenWorkspace}>
            Clinical workspace
          </PrimaryLink>
        </Card>
      </main>

      {/* ── Bottom nav (matches existing) ──────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-white/8 bg-[#0f1419]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {[
            { id: "command", label: "Command", icon: "◎", active: true },
            { id: "market",  label: "Market",  icon: "⊞", active: false },
            { id: "intel",   label: "Intel",   icon: "≈", active: false },
            { id: "actions", label: "Actions", icon: "→", active: false },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-[11px] ${
                item.active ? "text-[#d4a853]" : "text-white/45"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
