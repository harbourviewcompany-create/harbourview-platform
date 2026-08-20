# Clinical pilot authority inventory

**Date:** 2026-08-20  
**Purpose:** Read-only inventory of competent authorities for Clinical Command cross-links. Supports seeding `local_authorities` without inventing names.

## Rules

1. Only document regulators with an official public presence already referenced in-repo (`lib/clinical/authorityRegistry.ts`) or prior verified local-intel research.
2. Code registry (`CLINICAL_AUTHORITY_SEED`) is **link cards for Clinical UI** — not a substitute for `local_authorities` org-chart rows.
3. `clinical_jurisdiction_authority` is the **professional capability matrix** (may_prescribe, etc.) — seeded separately under clinical workflows governance; not covered by this inventory.
4. Additive SQL only; never overwrite batch1 CA/DE/NL/UY/MT rows.

## Tier-1 Clinical markets (flagship)

| ISO | Jurisdiction | Primary competent authority (documented) | Official entry point | Code registry | `local_authorities` |
|-----|--------------|------------------------------------------|----------------------|---------------|---------------------|
| CA | Canada | Health Canada / Cannabis Regulations | justice.gc.ca / canada.ca | Yes (detailed pack) | **Seeded** batch1 |
| DE | Germany | BfArM / Cannabisagentur | bfarm.de | Yes | **Seeded** batch1 |
| AU | Australia | TGA / ODC | tga.gov.au medicinal cannabis | Yes | **This pilot seed** |
| GB | United Kingdom | MHRA / Home Office (CBPM) | gov.uk medicinal cannabis collection | Yes | **This pilot seed** |

## Additional pilot (product / evidence fixture traffic)

| ISO | Jurisdiction | Primary competent authority | Official entry point | Code registry | `local_authorities` |
|-----|--------------|----------------------------|----------------------|---------------|---------------------|
| BR | Brazil | ANVISA | gov.br/anvisa | Yes | **This pilot seed** |
| NL | Netherlands | BMC / OMC / Farmatec | farmatec.nl / OMC | Yes | **Seeded** batch1 |

## Already seeded (batch1, June 2026)

Do not re-insert: **CA, DE, NL, UY, MT**.

## Pilot seed scope (this change)

**AU**

| Tier | Type | Name | Role |
|------|------|------|------|
| top | primary | Therapeutic Goods Administration (TGA) | Unapproved therapeutic goods / medicinal cannabis pathways (SAS, Authorised Prescriber) |
| mid | oversight | Office of Drug Control (ODC) | Import/export and controlled-substance licensing where applicable |

**GB**

| Tier | Type | Name | Role |
|------|------|------|------|
| top | primary | Medicines and Healthcare products Regulatory Agency (MHRA) | Medicines framework for cannabis-based products for medicinal use (CBPMs) |
| mid | oversight | Home Office | Controlled drugs / specialist prescribing policy context |

**BR**

| Tier | Type | Name | Role |
|------|------|------|------|
| top | primary | Agência Nacional de Vigilância Sanitária (ANVISA) | Authorization and regulation of cannabis-derived products and import pathways |

Confidence labels cite the in-repo clinical authority registry verification date (2026-08-16) and official hostnames only.

## Explicit non-goals

- No subdivision / municipal rows in this pass.
- No capability matrix rows (`may_prescribe` / `may_recommend`).
- No clinical evidence or formulary content.
- No authority names not already present in `authorityRegistry.ts` or batch1 research.

## Apply policy

Migration file is **additive and not self-applying in production**. Owner applies via normal Supabase migration gate after review.
