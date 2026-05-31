# Harbourview Design System Control

## Purpose

This file controls Harbourview visual and UX decisions so UI work does not drift into generic SaaS, cannabis-template or fake-intelligence styling.

## Brand position

Harbourview must feel premium, institutional, discreet, intelligence-led, commercially serious and calm.

Harbourview must not feel startup-generic, neon, crypto, gaming, NASA dashboard, consumer cannabis retail or bargain marketplace.

## Locked core language

Primary positioning:

`Market access backed by intelligence and relationships.`

Homepage eyebrow:

`Commercial intelligence and marketplace access`

Hero body:

`Harbourview helps serious operators identify qualified supply, buyer demand, commercial opportunities and market-entry pathways across regulated cannabis and adjacent supply chains.`

Primary CTA:

`Enter Marketplace`

Secondary CTA:

`Request Intelligence`

Desktop globe cue:

`Drag the globe. Hover a market. Follow the signal.`

Mobile globe cue:

`Tap a market to explore.`

## Color authority

| Token | Value | Use |
|---|---:|---|
| `--hv-black` | `#030508` | Page background and hero depth |
| `--hv-navy` | `#0B1A2F` | Primary brand field |
| `--hv-navy-deep` | `#081423` | Ocean and dark panels |
| `--hv-gold` | `#C6A55A` | Primary accent and key phrases |
| `--hv-gold-deep` | `#A8842D` | Metallic shadow and hover depth |
| `--hv-ivory` | `#F5F1E8` | Primary text on dark fields |
| `--hv-muted` | `#9CA3AF` | Secondary text only |

Rules:

- Use black or near-black behind the hero so navy water remains distinct
- Use deep navy water, not bright blue
- Use gold with restraint
- Do not use green as the primary cannabis signal
- Avoid neon, bright cyan glow and crypto gradients

## Typography direction

- Headlines and wordmark: Playfair Display Bold or equivalent premium serif
- Interface/body: Inter or equivalent clean sans-serif
- Use letter spacing only for wordmark or small uppercase labels
- Avoid novelty, sci-fi and script fonts

## Homepage globe hierarchy

Desktop:

1. Harbourview brand
2. Positioning line
3. Short commercial explanation
4. Marketplace CTA
5. Intelligence CTA
6. Globe interaction cue
7. Globe as dominant visual anchor
8. Lighthouse and subtle water as signature device

Mobile:

1. Brand visible early
2. Marketplace CTA visible in first viewport
3. Intelligence CTA accessible without confusion
4. Simplified globe or static fallback when needed

## Globe rules

- Raised country plates, restrained bevels and thin gold edges
- One label visible at a time
- Hover/tap highlights country and tracks lighthouse beam
- Reduced motion disables rotation, beam scanning and water motion
- Static globe fallback must preserve text and CTAs
- No fake live intelligence, city lights, crowded route lines or sci-fi styling

## Marketplace UI rules

Allowed:

- Clear listing cards
- Category cards
- Seller submission path
- Wanted request path
- Buyer quote/introduction capture
- Confidentiality and admin-review cues

Forbidden:

- Checkout, cart or payment language
- Direct seller contact reveal by default
- Fake urgency badges
- Fake inventory or active-buyer claims
- Consumer cannabis retail styling

## Copy rules

Use: market-access pathway, reviewed signal, commercial route, country-level brief, counterparty screen, opportunity category, confidential intake.

Avoid: guaranteed route, confirmed buyers, active deal flow, instant matching, disrupt, marketplace revolution.

## Accessibility requirements

Preserve keyboard navigation, visible focus states, contrast, descriptive buttons, reduced motion, reliable mobile tap targets, form labels and useful error states.

## Dashboard handoff

The platform dashboard design/spec is controlled by `docs/control/DASHBOARD_DESIGN_HANDOFF.md`. Dashboard implementation work must preserve its three-pillar structure: Marketplace, Intel Signals and Education.

## Completion criteria

A design change is complete only when it follows this palette/tone/hierarchy, names components changed, records screenshots or precise visual evidence, preserves accessibility basics and does not invent market intelligence.
