# Agent 0 Preflight Record

Signed: Agent 0 / ChatGPT
Date: 2026-04-27
Repo: harbourviewcompany-create/harbourview-platform
Branch: feat/marketplace-v1

## Objective

Start useful implementation work before Agent 1 begins, without pretending live Supabase or Google Drive verification has been completed.

## Verified GitHub access

GitHub repository access is available with admin, maintain, pull, push and triage permissions.

Repository confirmed:

- harbourviewcompany-create/harbourview-platform
- default branch: main
- active working branch: feat/marketplace-v1

## Immediate correction made

The Supabase config file previously pointed at the wrong project ref:

- old: tpfvhhrwzsofhdcfdenc
- required: zvxdgdkukjrrwamdpqrg

Updated file:

- supabase/config.toml

This is a low-risk configuration correction only. No secrets were touched. No migrations were applied. No destructive Supabase commands were run.

## Current source-of-truth rules

GitHub is source of truth for code.
Supabase is source of truth for live database state.
Google Drive should be used for coordination, handoffs, blockers, decisions and verification records once access is confirmed.

## What can be built before Agent 1

Safe work that does not require live Supabase verification:

1. Repository coordination docs
2. Preflight branch hygiene
3. Static config alignment
4. Non-destructive schema draft files
5. Marketplace domain model drafts
6. Test skeletons that do not claim live pass/fail
7. CI/lint/typecheck workflow scaffolding
8. Agent handoff templates
9. Safety guardrails preventing accidental migration execution

## What must wait for Agent 1

Do not claim or proceed past these until Agent 1 verifies them:

1. Live Supabase project state
2. Current deployed schema
3. RLS behavior
4. Existing migration parity
5. Feed/publish token behavior
6. Audit immutability behavior
7. Marketplace table compatibility against live database
8. Google Drive folder creation and coordination archive

## Hard boundaries

- Do not apply migrations yet.
- Do not run destructive Supabase commands.
- Do not print or request secrets in chat.
- Do not build Agent 2 instructions until Agent 1 produces a real handoff.
- Do not assume the live database matches repository migrations.
- Do not merge marketplace work until verification is complete.

## Agent 1 starting point

Agent 1 should begin from the existing operator handoff prompt, but first inspect this file and the corrected supabase/config.toml.

Agent 1 should not repeat solved work unless verification contradicts it.

## Agent 0 decision

CONTINUE TO AGENT 1.
