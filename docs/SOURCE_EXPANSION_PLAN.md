# HarbourView — Source Expansion Plan (Stage 6)

**Status:** Draft v1 · **Written:** 2026-07-20 · **Owner:** Tyler
**Prereq met:** The quality brain (translate → classify → embed → dedup → promote) is live and validated (signal recall 0.73, precision 0.906). It reads every language and rejects junk. This plan gives it better raw material.

---

## 1. The problem, quantified

The source estate is **broad but linguistically shallow.**

| Dimension | Current state |
|---|---|
| Active sources | 1,426 |
| Countries covered | 204 |
| Regulator-type sources | 403 |
| **English-language share** | **95%** (only 66 non-English sources total) |
| Non-English regulators (native primary) | **≈2, total** |

Coverage exists on paper, but almost every market is covered by **English secondary press**, not its **native-language primary regulator/gazette.** The per-market picture on your priority markets:

| Market | Sources | Native-lang | Native regulators |
|---|---|---|---|
| Germany | 7 | 1 | **0** |
| France | **1** | 1 | 0 |
| Spain | 2 | 1 | 0 |
| Italy | 2 | 2 | 1 |
| Portugal | 2 | 1 | 0 |
| Brazil | 6 | 1 | 0 |
| Mexico | 4 | 1 | 0 |
| Thailand | 14 | 1 | 0 |
| Japan | 4 | 1 | 0 |

Germany — Europe's largest regulated market — is tracked by 7 sources and **zero native-language regulators.** France, a market mid-reform, has **one source total.** This is why the promoted feed skews English and why primary regulatory events surface late (via English trade press) or not at all.

**Until this session, adding native sources was pointless** — the classifier couldn't read them (non-English recall was 0.40, so it dumped them as boilerplate). Translation fixed that. **Now** native sources are the single highest-ROI investment.

---

## 2. Strategy

Add **authoritative native-language PRIMARY sources** — official regulators and government gazettes — for priority markets, plus native trade press for Digest-grade stories. Three principles:

1. **Primary over secondary.** A German BfArM notice or the Bundesanzeiger is worth more than ten English aggregators rewriting it. Primary sources are first, authoritative, and citable.
2. **Native-language is now an asset, not a liability.** The brain translates on ingest; a Thai Royal Gazette entry becomes a clean English signal automatically.
3. **Let the feed prune itself.** Measure per-source signal yield (Section 4) and kill low-yield junk sources. The estate should get *smaller and better*, not just bigger.

---

## 3. Priority sources to add

Tier-1 markets and their authoritative primary sources. URLs to be verified at load time (regulators move paths); names are stable.

### Tier 1 — flagship regulated markets

**Germany** (de) — the biggest gap relative to importance
- BfArM — Bundesinstitut für Arzneimittel und Medizinprodukte (regulator, cannabis agency)
- Bundesanzeiger — official federal gazette (regulatory)
- Bundesministerium für Gesundheit (BMG) (government_official)
- Deutscher Bundestag — Drucksachen/legislation tracker (regulatory)

**France** (fr) — near-zero today
- ANSM — Agence nationale de sécurité du médicament (regulator)
- Légifrance — official legal gazette (regulatory)
- Ministère de la Santé (government_official)

**Spain** (es)
- AEMPS — Agencia Española de Medicamentos (regulator)
- BOE — Boletín Oficial del Estado (regulatory gazette)

**Italy** (it)
- AIFA — Agenzia Italiana del Farmaco (regulator)
- Gazzetta Ufficiale (regulatory gazette)

**Portugal** (pt)
- INFARMED (regulator)
- Diário da República (regulatory gazette)

**Switzerland** (de/fr/it)
- Swissmedic (regulator); BAG/OFSP (government_official); Federal Gazette / Bundesblatt

**Netherlands** (nl)
- Staatscourant (regulatory gazette); Bureau Medicinale Cannabis (regulator)

### Tier 1 — Latin America (Spanish/Portuguese primary)

- **Brazil** (pt): ANVISA (regulator); Diário Oficial da União (gazette)
- **Mexico** (es): COFEPRIS (regulator); Diario Oficial de la Federación (gazette)
- **Colombia** (es): INVIMA (regulator); Diario Oficial (gazette)
- **Argentina** (es): ANMAT (regulator); Boletín Oficial (gazette)
- **Uruguay** (es): IRCCA (regulator — the world's first national cannabis regulator)

### Tier 1 — Asia-Pacific & Africa

- **Thailand** (th): Thai FDA / อย. (regulator); Royal Gazette / ราชกิจจานุเบกษา (gazette)
- **Japan** (ja): MHLW (regulator); Kanpō / 官報 (official gazette)
- **South Africa** (en): SAHPRA (regulator — already English, verify coverage)
- **Israel** (he): Medical Cannabis Unit (Yakar Ha'Cannabis); Reshumot (official gazette)

### Tier 2 — expanding / emerging (add gazette + regulator each)
Czech Republic (cs), Poland (pl), Greece (el), Denmark (da), Malta (mt/en), Australia (en — TGA/ODC, verify depth), UK (en — MHRA/Home Office, verify depth), Ukraine (uk), Colombia already tier-1.

### Tier 3 — long tail
Use the existing `source_expansion_coverage_queue` to auto-detect zero-native-source countries and queue them for research, rather than hand-listing all 204.

---

## 4. The self-improving part (this is the moat)

Adding sources is table stakes. The differentiator is a **per-source quality loop** that makes the estate learn:

1. **Per-source yield.** Once the backfill completes, every signal carries a classifier verdict. Join signals back to their source and compute, per source: % `signal` vs % junk (spam/nav/boilerplate), freshness, and promotion rate.
2. **Prune.** Sources with near-zero signal yield (pure SEO/nav scrapers) get deactivated. This directly attacks the 97%-junk firehose at its origin.
3. **Prioritize.** High-yield sources get faster crawl cadence; low-yield get slowed or dropped.
4. **Self-heal coverage.** `source_expansion_coverage_queue` flags markets/languages where promoted-signal volume is below target, and queues them for source research — the system asks for the inputs it's missing.

This turns the source estate from a static list into a feedback system: **it gets smaller, cleaner, and more authoritative over time.** That's "better than anything that exists" — not more scrapers, but a self-curating source brain.

---

## 5. Execution

The registry is ready — no schema work needed. `source_registry` already has `language`, `content_type`, `source_type`, `tier`, `requires_translation`, `crawl_cadence`. Loading a native source is one insert; the pipeline (translate → classify → …) handles the rest automatically.

**Suggested order:**
1. Load Tier-1 primary sources (regulators + gazettes) for the 15 flagship markets above (~40–50 sources). Set `requires_translation=true`, correct `language`, `content_type='{regulatory}'`, `tier=1`.
2. Let the pipeline run one cycle; measure promoted-signal lift per market.
3. Build the per-source yield report (Section 4); deactivate the bottom decile of existing junk sources.
4. Wire the coverage queue to flag zero-native-source markets.
5. Expand Tier 2, then long-tail via the queue.

**Verification (per spec §6/§8):** promoted signals gain languages and countries; Digest receives `story` items; Signals quality holds (precision stays ≥0.90 on the eval set). Re-run the eval gate after any classifier-affecting change.

---

## 6. One caveat

Loading primary gazette sources often needs per-site adapters (some gazettes are PDF-only or JS-rendered). Budget adapter work for the awkward ones (Kanpō, Royal Gazette, Diário Oficial are PDF-heavy). Start with the sources that expose clean HTML/RSS and queue the hard ones.
