# Harbourview Design System Control

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This file controls Harbourview visual and UX decisions. It is strict enough for UI generators, coding agents and PR reviewers to reject off-brand work.

## Required fields for design work

Every design or UI ticket must state:

- Surface: homepage, marketplace, intake, admin, globe, evidence, research tool or other
- Target devices
- Existing files inspected
- Components changed
- Design tokens used
- Copy changed
- Accessibility checks
- Motion behavior
- Fallback behavior
- Evidence screenshots or visual notes

## Brand position

Harbourview must feel:

- Premium
- Institutional
- Discreet
- Intelligence-led
- Commercially serious
- Calm and controlled

Harbourview must not feel:

- Startup-generic
- Cannabis cliché
- Neon
- Crypto
- Gaming
- NASA dashboard
- Marketplace bargain-bin
- Brokerage spam

## Locked core language

Primary positioning:

`Market access backed by intelligence and relationships.`

Homepage hero eyebrow:

`Commercial intelligence and marketplace access`

Hero body:

`Harbourview helps serious operators identify qualified supply, buyer demand, commercial opportunities and market-entry pathways across regulated cannabis and adjacent supply chains.`

Primary CTA:

`Enter Marketplace`

Secondary CTA:

`Request Intelligence`

Globe cue desktop:

`Drag the globe. Hover a market. Follow the signal.`

Globe cue mobile:

`Tap a market to explore.`

## Color authority

Default Harbourview palette:

| Token | Value | Use |
|---|---:|---|
| `--hv-black` | `#030508` | Page background, hero depth |
| `--hv-navy` | `#0B1A2F` | Primary brand field |
| `--hv-navy-deep` | `#081423` | Ocean and dark panels |
| `--hv-gold` | `#C6A55A` | Primary accent, wordmark, key phrases |
| `--hv-gold-deep` | `#A8842D` | Metallic shadow, hover depth |
| `--hv-ivory` | `#F5F1E8` | Primary text on dark backgrounds |
| `--hv-muted` | `#9CA3AF` | Secondary text only |

Rules:

- Use black or near-black behind the hero so navy water remains distinct.
- Use deep navy water, not bright blue.
- Use gold as restrained authority, not decoration everywhere.
- Do not use green as the primary cannabis signal.
- Do not use neon blues, bright cyan glow, crypto gradients or saturated greens.

## Typography authority

Preferred direction:

- Wordmark and premium headlines: Playfair Display Bold or an equivalent high-contrast serif if the exact font is unavailable.
- Interface/body: Inter or equivalent clean sans-serif.
- Use generous letter spacing only on wordmark or small uppercase labels.
- Do not use novelty fonts, tech sci-fi fonts or handwritten scripts.

## Homepage globe direction

The homepage must load as Harbourview first, marketplace second.

Desktop hierarchy:

1. Harbourview brand
2. Positioning line
3. Short commercial explanation
4. Marketplace CTA
5. Intelligence CTA
6. Globe interaction cue
7. Globe as dominant visual anchor
8. Lighthouse and subtle water as signature brand device

Mobile hierarchy:

1. Harbourview brand visible in first viewport
2. Positioning line visible early
3. Marketplace CTA visible in first viewport
4. Intelligence CTA accessible without confusion
5. Simplified globe or static fallback if needed

Globe rules:

- Raised country plates are dark or metallic gold-edged, not glowing map dots.
- One label visible at a time.
- Hover or tap highlights country plate and tracks lighthouse beam.
- No fake live intelligence.
- No city lights.
- No satellite realism.
- No crowded route lines.
- Reduced motion disables rotation, beam scanning and water motion.
- Static premium globe fallback must preserve text and CTAs.

## Marketplace UI direction

Marketplace should be functional, restrained and trust-building.

Allowed:

- Clear listing cards
- Category cards
- Seller submission path
- Wanted request path
- Buyer quote or introduction capture
- Confidentiality cues
- Admin review status language

Forbidden:

- Checkout UI
- Cart language
- Seller direct-contact reveal by default
- Fake urgency badges
- Fake inventory claims
- Unverified active buyer claims
- Consumer cannabis retail styling

## Copy tone rules

Use:

- market-access pathway
- reviewed signal
- commercial route
- country-level brief
- counterparty screen
- opportunity category
- qualified supply
- buyer demand when evidence exists
- confidential intake

Avoid:

- live demand
- guaranteed route
- confirmed buyers
- exclusive access
- active deal flow
- plug and play
- instant matching
- disrupt
- marketplace revolution

## Accessibility requirements

Every UI change must preserve:

- Keyboard navigation
- Visible focus states
- Sufficient text contrast
- Button text that describes the action
- Reduced-motion behavior where motion exists
- Mobile tap targets large enough for reliable use
- Form labels associated with controls
- Error states that explain what to fix

## Visual QA requirements

For UI work, capture or record:

- Desktop viewport result
- Mobile viewport result
- Reduced-motion behavior if applicable
- Empty/error/loading states if changed
- CTA visibility
- Any known mismatch against this file

## Forbidden vague language

Do not use:

- premium look without specifying tokens and layout
- modern design
- clean UI
- make it pop
- elegant enough
- vibes are right
- more polish
- cool animation

## Completion criteria

A design change is complete only when:

- It follows the locked palette, tone and hierarchy.
- It names the components changed.
- It records screenshots or precise visual evidence.
- It preserves accessibility basics.
- It does not invent market intelligence.
- It does not add out-of-scope marketplace behavior.
