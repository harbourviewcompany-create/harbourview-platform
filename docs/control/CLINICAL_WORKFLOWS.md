# Clinical Workflows

**Status:** Active control document  
**Owner:** Harbourview (data controller)  
**Related:** `CLINICAL_DATA_CLASSIFICATION.md`, migrations `20260727160000`–`20260727162000`

## 1. Clinician verification workflow

**Goal:** Only verified clinicians access Restricted clinical features.

| Step | Actor | Action | System state |
|------|-------|--------|--------------|
| 1 | Clinician | Registers / links account; submits licence number, jurisdiction, clinical_role via professional directory profile | `hv_professionals` row; `verification_status` ≠ verified |
| 2 | Admin | Reviews licence against issuing body; records notes | `verified_by`, `verification_notes` set |
| 3 | Admin / service | Marks verified; links auth user | `verification_status = 'verified'`, `status = 'active'`, `user_id` set; row in `clinical_clinician_links` (`active`) |
| 4 | System | `is_verified_clinician(uid)` returns true | Clinical RLS opens for that user |

**Fail closed:** Missing link, suspended link, or non-verified status → no clinical access.

**Suspension:** Set `clinical_clinician_links.link_status` to `suspended`/`revoked` and/or professional `status` ≠ `active`.

---

## 2. Patient create + care team

| Step | Rule |
|------|------|
| Create patient | Verified clinician only; `created_by = auth.uid()` |
| After insert | Trigger adds creator as `treating_clinician` on `clinical_care_team`; audit `patient.create` |
| Access | Creator or active care-team member |
| Add teammate | Treating clinician or care coordinator inserts care-team row |

Consent is **not** required to create the demographic shell (so consent can be recorded against the patient). Core clinical actions **require** consent (below).

---

## 3. Consent workflow

**Required before encounters, calculations, recommendations, prescriptions, dispensing:**

- `treatment` — status `granted`, in force  
- `data_processing` — status `granted`, in force  

Enforced by `clinical_require_core_consent(patient_id)` on those write paths.

| Consent type | Typical use |
|--------------|-------------|
| treatment | Care delivery |
| data_processing | Harbourview as controller processing identifiable data |
| sharing_with_care_team | Explicit share beyond creating clinician |
| research_optional | Optional research |
| marketing_optional | Optional marketing |

**Withdraw:** Insert or update to `status = 'withdrawn'` (prefer new row with effective dates for history). Audit via consent insert trigger.

**App requirement:** UI must collect treatment + data_processing before offering encounter / calc / Rx actions. DB is the backstop.

---

## 4. Encounter workflow

```
open (consent required) → document → close | cancel
```

- Insert blocked without core consent.  
- Audit: `encounter.open`, `encounter.status.*`.  
- Clinician of record: `clinician_user_id`; care team may read.

---

## 5. Dose calculation workflow

```
verify clinician → authority may_calculate_dose → consent →
run algorithm (app) → INSERT clinical_calculations
  (calculator_key, algorithm_version, inputs, outputs)
→ audit calculation.compute
```

- Algorithm **logic lives in application code** (versioned modules).  
- DB stores immutable run record + version string.  
- No calculation without jurisdiction authority row allowing `calculate_dose`.

---

## 6. Recommendation + appropriateness claim workflow

```
consent + may_recommend → create recommendation
  (evidence_version, summary, detail)

If appropriateness_claim set:
  require may_claim_appropriateness
  set clinician_attestation_at
  audit recommendation.with_appropriateness
```

Claims enum: `appropriate` | `appropriate_with_cautions` | `not_appropriate` | `insufficient_data`.

**Product rule:** UI must show jurisdiction, evidence version, and that the claim is clinician-attested decision support — not an autonomous medical device output — per legal review.

---

## 7. Prescribe → dispense workflow

```
draft
  → signed (prescriber; may_prescribe; signed_at)
  → sent_to_pharmacy (optional status)
  → dispensed | partially_dispensed
  → cancelled | expired
```

**Dispense:**

- Pharmacist (or role with `may_dispense`)  
- Prescription status in `signed` | `sent_to_pharmacy` | `partially_dispensed`  
- Insert `clinical_dispensing_events` → prescription status → `dispensed`  
- Audit `dispensing.completed`

**Cancel:** Prescriber/care-team update; `cancelled_at` set by trigger.

---

## 8. Jurisdiction authority matrix

Table: `clinical_jurisdiction_authority`

| Capability | Column |
|------------|--------|
| recommend | `may_recommend` |
| calculate_dose | `may_calculate_dose` |
| prescribe | `may_prescribe` |
| dispense | `may_dispense` |
| claim_appropriateness | `may_claim_appropriateness` |

**Fail closed:** No row for (jurisdiction, clinical_role) → deny.

Seed data is **not** auto-loaded for all countries (legal accuracy). Operators load rows per jurisdiction after legal/clinical review. App must not invent authority.

---

## 9. Audit coverage (minimum)

| Event | Source |
|-------|--------|
| patient.create | trigger |
| consent.* | trigger |
| encounter.open / status | trigger |
| calculation.compute | trigger |
| recommendation.create / with_appropriateness | trigger |
| prescription.* | trigger |
| dispensing.completed | trigger |
| access denied | app should call `clinical_audit_write` on caught 42501 |

`clinical_audit_log` remains append-only; no public SELECT.

---

## 10. Command Centre Clinical panel (product mapping)

Top-level panel surfaces, in order of build:

1. Verification status / request verification  
2. Patient list (care-team scoped)  
3. Patient record: demographics, consent, care team, encounters  
4. Calculators (write `clinical_calculations`)  
5. Recommendations (write `clinical_recommendations`)  
6. Prescriptions queue + dispensing actions  

All routes: authenticated + verified clinician; service-role server actions preferred; never public DTO.

---

## 11. Still application-layer (not SQL alone)

- Calculator algorithm implementations and UI  
- Evidence content packs / formulary data binding  
- Admin verification review UI  
- Command Centre + mobile Clinical panel  
- Seeding jurisdiction authority after legal sign-off  
- Subject-access / retention job runners  

Schema and triggers define the **workflow contract**; app must implement the clinical logic and UX on top.
