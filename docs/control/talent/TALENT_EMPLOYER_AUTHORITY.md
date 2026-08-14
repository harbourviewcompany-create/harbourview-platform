# Talent Employer Authority

Anchors: TAL-016–022, TAL-053, TAL-076–078, TAL-097–099; TAC-006,007,017–019,040.

`workspaces` remains the canonical Harbourview-managed organization identity. Existing global workspace roles (`admin`, `operator`, `analyst`, `viewer`) are not repurposed as recruiting permissions.

Talent-specific roles: `talent_admin`, `recruiter`, `hiring_manager`, `interviewer`, `talent_viewer`.

Authorization requires applicable workspace relationship + active Talent role + entitlement + requisition assignment where scoped. Agency recruiters additionally require an active agency engagement. Organization verification, domain verification, recruiter identity and hiring authority are distinct trust dimensions.

Every sensitive operation re-evaluates current authority. Bulk export/outreach/status mutation requires separate entitlement and rate/volume controls. Expired mandate, removed membership or suspended employer immediately removes authority independent of stale UI/session state.

Human/manual authority overrides require CTL-021 reason/audit controls.