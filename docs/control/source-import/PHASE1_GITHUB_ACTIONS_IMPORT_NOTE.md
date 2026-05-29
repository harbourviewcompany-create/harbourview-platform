# Phase 1 GitHub Actions Source Import

Temporary branch for controlled source import execution. This branch is intended to add workflow-only/import-only automation. It must not alter public routes, crawlers, application pages, marketplace output, or production UI.

Current execution boundary: the repository import scripts and Supabase RPC already exist. The workflow requires `data/source-import/cannabis_sources_5000.json` or reconstructed `data/source-import/payload_chunks/*.b64` to be present in the branch before running with `run_import=IMPORT`.
