# Software Factory Template

This folder is the canonical starting point for building low-friction web applications, platforms and local software with AI-assisted execution.

## Objective

Turn an idea into a testable product with the least possible manual operator action.

Pipeline:

Idea -> Intake -> Product brief -> Workflow map -> Data model -> Permissions -> Architecture -> Scaffold -> Implementation -> Tests -> Hardening -> Installer -> Release packet.

## What this template optimizes

- Minimal manual setup
- Repeatable project creation
- AI handoff clarity
- Local-first testing
- GitHub-based change tracking
- Supabase-ready backend spine
- Windows-friendly scripts
- Production-grade acceptance gates

## Folder map

```text
factory-template/
  FACTORY_CANONICAL.md
  README.md
  docs/
    WORKFLOW.md
    OPERATOR_HANDOFF.md
  prompts/
    00_master_factory_prompt.md
    01_builder_prompt.md
  scripts/
    init-project.ps1
    health-check.ps1
  templates/
    next-supabase/
      app/
      lib/
      supabase/migrations/
      tests/
```

## Default stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- PostgreSQL RLS
- Vitest
- Playwright-ready structure
- PowerShell automation for Windows

## Operator rule

Do not start from a blank repo again. Start from this factory template, copy the selected template, fill the intake fields and run the scripts.
