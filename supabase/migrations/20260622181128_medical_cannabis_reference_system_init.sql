create extension if not exists pgcrypto;

create table if not exists reference_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

insert into reference_systems (name, version, content)
values (
  'Medical Cannabis Professional Reference System',
  '0.1.0',
  '{
    "system": "Medical Cannabis Professional Reference System",
    "created": "2026-06",
    "modules": [
      "Physician Handbook",
      "Nurse Handbook",
      "Pharmacist Handbook",
      "Toxicology Handbook",
      "Pharmacogenomics Handbook",
      "Product Quality & Manufacturing",
      "Hospital Medicine",
      "Surgery & Perioperative Care",
      "Mental Health",
      "Cannabis Use Disorder",
      "Regulatory Landscape",
      "Insurance & Reimbursement",
      "Health Economics",
      "Research Methods",
      "Global Formulary",
      "Future Technologies"
    ],
    "dependencies": {
      "Physician Handbook": ["Pharmacology", "Drug Interactions", "Evidence Grading", "Dosage Systems"],
      "Pharmacist Handbook": ["Product Quality", "Pharmacokinetics", "Drug Interactions"],
      "Nurse Handbook": ["Administration", "Monitoring", "Adverse Effects"],
      "Toxicology Handbook": ["Acute Effects", "Overdose Management", "Emergency Medicine"],
      "Surgery": ["Anesthesia Interactions", "Perioperative Management"],
      "Mental Health": ["Psychosis Risk", "Anxiety/Depression Evidence"],
      "CUD": ["Diagnostics", "Withdrawal", "Behavioral Interventions"]
    },
    "decision_support_objects": [
      "dosing_algorithms",
      "drug_interaction_matrix",
      "condition_treatment_trees",
      "risk_stratification_tools",
      "monitoring_protocols"
    ],
    "evidence_framework": {
      "levels": ["High", "Moderate", "Low", "Very Low"],
      "types": ["RCT", "Meta-analysis", "Observational", "Preclinical"],
      "grading_system": "modified_GRADE"
    },
    "databases": [
      "cannabinoids",
      "terpenes",
      "formulations",
      "drug_interactions",
      "clinical_indications"
    ],
    "note": "Expanded master TOC stored as system scaffold; full chapter expansion to be loaded as child tables or versioned JSON documents."
  }'::jsonb
);
