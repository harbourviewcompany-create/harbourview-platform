# Automating Design Tokens from Figma

## Recommended Stack (2026)

- **Figma** + **Tokens Studio** (by Tokens Studio) — Best-in-class token management in Figma
- **Style Dictionary** — Transforms tokens into multiple formats (CSS, Tailwind, TS, etc.)
- **Optional**: Figma REST API + custom script for fully automated CI sync

## Step-by-Step Setup

### 1. In Figma (One-time)

1. Install **Tokens Studio** plugin (free tier available).
2. Create your design tokens in Figma using the plugin.
3. Organize into token sets: `global`, `light`, `dark`.
4. Export tokens as JSON (or use their sync features).

### 2. In This Repo

We've already set up the foundation:

- `tokens/` folder with example JSON structure
- `style-dictionary.config.js`
- Generation script at `scripts/generate-tokens.js`

### 3. Generate Tokens Locally

```bash
# Install dependencies
npm install style-dictionary chokidar-cli --save-dev

# Generate tokens
npm run tokens:generate
```

This will output:
- `styles/design-tokens.css` (CSS variables)
- `lib/design-tokens.ts` (TypeScript definitions)

### 4. Watch Mode (Recommended during design work)

```bash
npm run tokens:watch
```

Automatically regenerates tokens when you change JSON files.

### 5. Full Automation Options

**Option A: Manual Export (Recommended to start)**
- Designer updates tokens in Figma → Exports JSON → Commits to `tokens/` folder → `npm run tokens:generate`

**Option B: GitHub Action (Advanced)**
Create `.github/workflows/sync-figma-tokens.yml`:

```yaml
name: Sync Figma Tokens
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Every weekday at 9am
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
      - name: Fetch tokens from Figma
        # Use Figma API or Tokens Studio sync
      - name: Generate tokens
        run: npm run tokens:generate
      - name: Create PR
        uses: peter-evans/create-pull-request@v6
```

**Option C: Tokens Studio Sync**
Tokens Studio has built-in sync capabilities that can push directly to Git.

## Current Token Structure

```
tokens/
├── $metadata.json
├── global.json
├── light.json
└── dark.json
```

## Next Improvements

- Add typography tokens
- Add spacing scale
- Add component-specific tokens (button, card, etc.)
- Set up proper CI/CD pipeline for token sync

---

**Status**: Foundation is ready. You can start using this workflow immediately.