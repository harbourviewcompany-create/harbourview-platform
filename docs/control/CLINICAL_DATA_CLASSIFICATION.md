# Clinical Data Classification

**Status:** Active control document  
**Owner:** Harbourview  
**Effective:** 2026-07-27  
**Related:** Clinical software architecture decision (Command Centre Clinical panel)

## Purpose

Defines data classification, controller posture, and access rules for the clinical domain. This document is binding for all agents and contributors working on clinical tables, routes, calculators, recommendations, or patient-related surfaces.

## Controller

Harbourview is the **data controller** for clinical and patient data stored in this platform.

- Patient consent must be captured and stored before any identifiable patient record is created.
- Retention, access requests, and breach process obligations sit with Harbourview.
- Commercial intelligence tables remain separate; clinical data must never leak into public DTOs or commercial feeds.

## Classification tiers

| Tier | Examples | Public routes | Authenticated non-clinician | Verified clinician | Admin / service_role |
|------|----------|---------------|----------------------------|--------------------|----------------------|
| **Public** | Approved clinical education summaries, public-safe pathway overviews | Allowed | Allowed | Allowed | Allowed |
| **Internal** | Evidence versions, jurisdiction clinical rule drafts, review metadata | Denied | Denied | Read where linked to verified role | Full |
| **Restricted (clinical)** | Patient records, encounters, calculations, recommendations, audit log, clinician–patient links | Denied | Denied | Own linked patients / own actions only | Full (audited) |

## Clinician verification (gating)

Clinical features that touch Restricted data require:

1. `hv_professionals.verification_status = 'verified'`
2. `hv_professionals.status = 'active'`
3. `hv_professionals.clinical_role` set (`doctor` \| `pharmacist` \| `nurse` \| `nurse_practitioner` \| `other`)
4. Active row in `clinical_clinician_links` for the auth user

Verification method: existing professional directory + licence number + licence jurisdiction + admin review.

`clinical_role` drives feature gating (e.g. prescribing actions only for roles with authority in the selected jurisdiction). Country-specific titles remain in `title` / `credential_type`.

## Audit requirements

Every access, create, update, calculate, recommend, export, and access-denied event on Restricted clinical resources must be written to `clinical_audit_log`.

- Table is append-only (no UPDATE/DELETE policies).
- No public or authenticated SELECT; service_role (and future admin read path) only.
- Calculation and recommendation rows must store the evidence/rule version used.

## Consent

Before creating any identifiable patient record:

1. Lawful basis and consent record must exist and be stored.
2. Jurisdiction of care must be recorded.
3. Minimum necessary data principle applies.

## Isolation from commercial surfaces

- Clinical tables are not exposed via public API views.
- Public/private DTO allowlist does not include patient, calculation, or recommendation fields.
- Command Centre Clinical panel is gated; commercial panels remain unchanged.

## Build order constraint

Controls (this document + clinician verification + audit log + RLS) ship **before**:

- Patient / encounter tables
- Dose calculators
- Personalised recommendations
- Prescribing / dispensing workflows
- Clinical UI in Command Centre

## Change control

Changes to clinical classification, consent model, or audit requirements require:

1. Update to this document
2. PR with evidence log entry
3. Explicit operator sign-off before merge when expanding Restricted surface area
