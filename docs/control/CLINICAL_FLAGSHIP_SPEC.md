# Clinical Section — Current-State Diagnosis and Flagship Specification

**Status:** Diagnosis verified live 2026-08-16. Specification **proposed, not approved.**
**Scope:** the mobile Command Centre `#clinical` section, `/api/clinical/*`, and the
`clinical_*` schema in project `zvxdgdkukjrrwamdpqrg`.
**Author's note:** every "current state" claim below was checked against the live database or
the code on this branch. Nothing here is carried over from an earlier session's summary.

---

## Part 1 — Why it doesn't work

### Finding 1 — The evidence spine is effectively empty (root cause)

Live counts, `public` schema, 2026-08-16:

| Table | Rows | Published |
|---|---|---|
| `clinical_evidence_records` | 3 | 3 |
| `clinical_evidence_change_events` | 1 | 1 |
| `clinical_condition_terms` | **0** | 0 |

All three evidence records are Canadian regulatory/guidance documents
(`Cannabis Regulations §273`, Health Canada practitioner information, Health Canada
adverse-reaction reporting). **All three have `condition_label = NULL`, `cannabinoids = {}`,
and `evidence_strength = 'ungraded'`.** There is not one condition-level record in the system.

Consequence: the search box is titled "Evidence by condition" and there is no condition-level
evidence to return. Any clinical query — Dravet syndrome, chemotherapy-induced nausea,
chronic neuropathic pain, spasticity — returns nothing, and always will until records exist.
The section is not broken code; it is a working shell over an empty corpus.

A second-order effect makes the failure look worse than it is. `search_clinical_evidence_records`
returns nothing, then `clinical_condition_term_known` is consulted to distinguish
*"we know this condition, we have no evidence yet"* (`no-evidence`) from
*"we don't recognise this at all"* (`no-match`). Because `clinical_condition_terms` is empty,
that check always returns false, so every query — including perfectly valid ones — gets the
harshest possible message: **"No reviewed condition or evidence record matches this search."**
The system cannot currently tell a clinician the difference between an unknown term and a
known coverage gap.

### Finding 2 — Seven built clinical migrations were never applied to production

`supabase_migrations.schema_migrations` contains exactly one of the eight clinical-evidence
migrations in the repository:

| Migration | In repo | Applied |
|---|---|---|
| `20260814121500_clinical_evidence_spine` | yes | **yes** |
| `20260814134500_clinical_evidence_v1_governance` | yes | no |
| `20260814135500_clinical_evidence_v1_source_reconciliation` | yes | no |
| `20260814143500_clinical_evidence_v1_production_foundation` | yes | no |
| `20260814144000_clinical_evidence_v1_audit_immutability` | yes | no |
| `20260814150000_clinical_evidence_v1_1_operations` | yes | no |
| `20260814151000_clinical_evidence_v1_1_canadian_nabilone_source` | yes | no |

This is the exact failure mode recorded in `docs/control/AGENT_OPERATING_FACTS.md`: merging a
migration does not apply it. What is sitting unapplied is not incidental — it is the entire
governance layer that makes this section defensible to a prescriber:

- `clinical_condition_terms` **seed data** (governance migration, line 250) — the missing
  condition vocabulary from Finding 1
- `clinical_reviewer_credentials` + `clinical_require_credentialed_qualified_review()` — the
  rule that only a credential-verified clinician or pharmacist can publish clinical content
- `clinical_evidence_source_snapshots` with content-hash immutability — proof that a cited
  source said what we claim it said, on the date we claim
- `clinical_evidence_grade_assessments` — GRADE domains (risk of bias, inconsistency,
  indirectness, imprecision, publication bias) behind every certainty rating
- `clinical_evidence_outcome_links` — the condition → outcome → direction-of-effect structure
  that a "what does the evidence say" answer is actually made of
- `clinical_evidence_intake_queue` + operation events — the pipeline that would keep it current
- A first condition-level source (Canadian nabilone) — i.e. record #4, the first one that
  would ever answer a clinical question

The application code already reads columns these migrations create — `mapEvidence()` in
`lib/server/clinicalEvidenceQuery.ts` reads `freshness_status`, `publication_scope`,
`grading_method_key`, `review_due_at`, `source_currentness_checked_at` and
`primary_source_registry_id`, **none of which exist in the production table**. They silently
map to `null`, so freshness and grading provenance are dead fields in the UI today.

### Finding 3 — The section shows Canadian federal law regardless of jurisdiction

Two defects, both fixed on this branch:

1. `ClinicalEvidenceExplorer` derived its jurisdiction by parsing the ISO code out of the URL,
   mapping only `CA → "Canada"` and passing everything else through raw. Evidence records store
   full jurisdiction names, so `'DE' = any(jurisdictions)` never matched: **every non-Canadian
   market was guaranteed zero results**, independent of Finding 1. When the country parameter
   was absent it fell back to the literal string `'Canada'` — labelling another country's
   workspace "Evidence by condition · Canada".
2. `ClinicalSection` rendered `CANADA_CLINICAL_AUTHORITIES` unconditionally. A prescriber in
   Germany, Australia or Israel was shown *Cannabis Regulations* §272/§273 and Health Canada
   reporting guidance as their "primary authority", with no indication it was foreign law.

(2) is the more serious of the two: wrong-jurisdiction legal guidance presented to a prescriber
as authoritative is worse than no guidance. Both are corrected — the jurisdiction now comes from
the resolved country display name, and the authority deck resolves per jurisdiction, showing an
explicit "no reviewed primary authority for this jurisdiction" state instead of Canadian law.

**Related, not yet fixed:** there is no shared jurisdiction vocabulary. `clinical_evidence_records.jurisdictions`
is free-text `text[]`, while the country registry uses UN canonical names
("United States of America", "Netherlands (Kingdom of the)", "Republic of Korea"). Any evidence
record seeded as "United States" or "Netherlands" will silently never match. This needs a foreign
key to the country identity rows, not a convention.

### Finding 4 — The clinical API surface has no schema behind it

`app/api/clinical/` exposes `patients`, `patients/[id]/consent`, `prescriptions`,
`calculations`, `recommendations`, `verification/request`, `admin/verify` and `me`. A live check
for any table matching `%patient%`, `%prescription%`, `%calculation%` or `%clinician%` in the
`public` or `clinical` schemas returns **zero rows**.

Unlike Finding 2, **this is deliberate**. `supabase/release-controls/pending-production-migration-decisions.json`
classifies all four migrations (`20260727160000` control foundation, `161000` patient core,
`162000` workflows, `163000` API surface) as `separately_authorized` /
`independent_release_not_authorized`. Patient-identifiable data has not been authorised for
production, which is the correct posture for a platform with no clinical governance sign-off yet.

That decision should be respected — but the code shipped without it, so those routes are live
endpoints against a schema that does not exist. They need to fail closed and say so, rather than
fail with a database error.

### Summary of Part 1

| Symptom | Root cause | Reversible by |
|---|---|---|
| Every search returns "no match" | Zero condition-level evidence records | Content + migration release |
| Harshest error copy on valid conditions | `clinical_condition_terms` empty | Applying governance migration |
| Non-Canadian markets always empty | ISO code sent as jurisdiction name | **Fixed on this branch** |
| Canadian law shown to foreign prescribers | Unconditional authority deck | **Fixed on this branch** |
| Freshness / grading fields always blank | Columns not in production | Applying production-foundation migration |
| Patient/prescription routes non-functional | Schema deliberately not authorised | Governance decision (Tyler) |

---

## Part 2 — What a flagship clinical section needs

The question behind the section is not "what evidence exists?" It is what a prescriber actually
has to answer before writing an authorization:

> *Can I authorize this here? For this patient, with these comorbidities and these
> medications? Which product and what starting dose? What do I monitor, and when do I stop?
> What do I have to document, and what do I have to report?*

Today the section answers none of these. It answers a seventh, narrower question — "show me
Canadian federal source documents" — and answers it well. The gap between those is the build.

Ordered by clinical value per unit of effort. Each tier is independently shippable.

### Tier 1 — Make the existing spine honest and non-empty

*Nothing new is designed here; this is releasing what is already built.*

1. Apply the six unapplied evidence migrations, in order, with the `AGENT_OPERATING_FACTS.md`
   verification query run after each. This alone restores condition vocabulary, credentialed
   review, source snapshots, GRADE assessments and outcome links.
2. Seed a first condition corpus. The defensible starting set is the indications with real
   regulatory or high-certainty evidence, not the long tail:
   Dravet syndrome and Lennox-Gastaut (CBD, regulatory-approved), chemotherapy-induced nausea
   and vomiting (nabilone, product monograph), MS-related spasticity (nabiximols),
   chronic neuropathic pain (systematic-review level, low-to-moderate certainty).
   Five conditions with proper GRADE assessments beat five hundred stub records.
3. Separate "unknown term" from "known gap" in the UI. Once `clinical_condition_terms` is
   populated, `no-evidence` becomes reachable and should read as a *coverage* statement:
   "Dravet syndrome is a recognised indication. No reviewed evidence record is published in this
   spine yet." That is a credible answer. "No match" is not.
4. Show coverage before the user types. The search box currently opens onto a void — a clinician
   has no way to know what the corpus contains without guessing. List the covered conditions,
   with record counts and last-verified dates, as browsable chips. This is the single highest-value
   UI change in the document and it depends only on data that Tier 1 creates.

### Tier 2 — Answer "can I authorize this here?"

5. **Jurisdiction × profession authorization matrix.** The contract type already exists and is
   unused: `ProvinceProfessionAuthorizationContract` in `lib/clinical/evidence.ts` — jurisdiction,
   region, profession, capability (`authorize` / `prescribe` / `dispense` / `monitor` / `document`),
   status, requirement summary, primary source. A nurse practitioner in Ontario and one in Quebec
   do not have the same authority; a pharmacist's dispensing scope differs again. This is a table
   plus a lookup, and it is the first thing a clinician needs to know.
6. **Documentation requirements as a checklist, not a link.** Today the medical-document card
   links to §273 and asks the clinician to read the regulation. The requirements are enumerable:
   patient name, practitioner details, daily quantity in grams, period of use, licence number,
   date. Render them as a completion checklist bound to the jurisdiction, with the section
   citation on each line.
7. **Jurisdiction-resolved authority decks for the top medical markets.** The Canadian deck is the
   template and it is good. Germany (BfArM / *Medizinal-Cannabisgesetz*), Australia (TGA Special
   Access Scheme and Authorised Prescriber pathways), Israel (IMC-GAP/GDP unit), UK (MHRA and
   specialist-register restriction) are the markets where prescribers actually exist. Each needs
   its own verified deck; none should ever inherit another's.

### Tier 3 — Answer "is this safe for this patient?"

8. **Structured drug–cannabinoid interaction lookup.** `MedicationCannabinoidInteractionContract`
   is defined and unused. The clinically material set is small and well documented — CYP3A4 and
   CYP2C19 substrates, clobazam (the norclobazam accumulation with CBD is the canonical example),
   warfarin, valproate hepatotoxicity with CBD, sedative and CNS-depressant additivity, tacrolimus.
   The current UI explicitly disclaims having this ("Harbourview does not present a structured
   interaction checker until a reviewed interaction contract is wired"), which is honest — and
   also the single feature most likely to make a pharmacist use this daily.
9. **Contraindication and cautions surface.** Psychosis and schizophrenia history, cardiovascular
   disease, pregnancy and lactation, age thresholds, hepatic impairment dose adjustment. Each
   bound to a primary source and a certainty rating, never to a generalisation.
10. **Special populations.** Paediatric, geriatric, renal and hepatic impairment, and known
    driving/occupational-safety guidance. `dosing.ts` already flags low body weight; the rest is absent.

### Tier 4 — Answer "what do I actually prescribe, and then what?"

11. **Surface the dosing calculator that already exists.** `lib/clinical/dosing.ts` implements a
    versioned, conservatively bounded weight-based starting-dose calculator
    (`DOSING_ALGORITHM_VERSION = 2026.08.2`, hard ceiling 15 mg/kg/day, THC/CBD split by product
    ratio, cautions attached). It is fully written, tested behaviour, and **reachable from no UI in
    this section.** Wiring it in is small. Its own file comment states the ceiling requires
    qualified clinical/legal review before use with a real patient — that review is a
    prerequisite to exposing it, not an afterthought.
12. **Titration schedules** — start-low-go-slow expressed as a concrete week-by-week schedule per
    indication, with the review point at each step, rather than as advice.
13. **Product-to-evidence bridge.** Harbourview already holds a supply catalogue and cultivar
    passports. A prescriber choosing a 20:1 CBD:THC oil should see which evidence records apply to
    that ratio and formulation. No competitor in this space can do this, because none of them hold
    both sides. This is the section's genuine differentiator — and per `AGENTS.md`'s
    depth gate, two surfaces covering the same entity with no cross-reference is itself a defect.
14. **Monitoring and pharmacovigilance loop.** `ClinicalMonitoringContract` and
    `ClinicalPharmacovigilanceContract` are defined and unused. Follow-up scheduling and adverse-event
    capture depend on the patient schema in Finding 4 and are therefore gated on that governance
    decision — but the *reporting* half (structured adverse-reaction submission guidance per
    jurisdiction) is not, and can ship without any patient data.

### What is deliberately excluded

- **Anything that reads as a treatment recommendation.** The synthesis block is explicitly a
  provenance count and says so. That boundary is correct and should survive every tier above.
- **Patient records, prescriptions, and consent capture**, until the governance decision in
  Finding 4 is revisited. Everything in Tiers 1–3 and most of Tier 4 works without them.
- **Any evidence record without a hashed source snapshot and a credentialed review**, once the
  production-foundation migration is applied. That is what makes this a clinical instrument
  rather than a link collection.

---

## Part 3 — Sequencing and gates

| Step | Action | Requires |
|---|---|---|
| 0 | Merge this branch's jurisdiction fixes | Standard PR review |
| 1 | Apply 6 unapplied evidence migrations | **Production sign-off (Rule 3c)** |
| 2 | Verify each with the `schema_migrations` query | — |
| 3 | Seed first condition corpus | **Clinical sourcing bar agreed first** |
| 4 | Coverage-first search UI + `no-evidence` state | Steps 1–3 |
| 5 | Authorization matrix (Tier 2) | New spec |
| 6 | Interaction lookup (Tier 3) | New spec + qualified review |
| 7 | Dosing calculator exposure | **Qualified clinical/legal review of the ceiling** |

Open question that blocks step 3 and should be answered before any content work starts:
**what sourcing bar applies to clinical content — primary sources only (regulator, product
monograph, indexed systematic review), or is secondary synthesis acceptable with attribution?**
The schema is built for the former. The answer changes the volume of what can ship by roughly an
order of magnitude, and it is not a decision to make implicitly.
