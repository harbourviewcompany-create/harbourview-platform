# Harbourview Dashboard Design Handoff

## Purpose

This document defines the approved desktop and mobile dashboard design handoff for the Harbourview platform. It is a design/specification pass only: it defines layout, component hierarchy, responsive behavior, and visual rules for a future implementation. It does not authorize a product-scope expansion, new claims, new data capabilities, payments, subscriptions, automation, or production-readiness messaging.

## Source-of-Truth Constraints

- The dashboard has exactly three primary product pillars: Marketplace, Intel Signals, and Education.
- Marketplace is the primary commercial surface; Intel Signals is the differentiator; Education is the supporting professional-learning pillar.
- Harbourview branding is a gold wordmark only. Do not place a compass logo, icon mark, monogram, or other symbol beside the wordmark.
- The interface must feel like a serious commercial intelligence and marketplace platform, not a generic SaaS dashboard or pharma-only market-access workflow.
- Use concrete marketplace listings, concrete signal rows, and concrete education resources. Do not use revenue charts, pie charts, generic KPI panels, testimonials, or fake performance analytics.
- The Intel heatmap globe is a strong module, not a full-page hero that displaces the marketplace.

## Visual Direction

The dashboard uses a premium dark navy and near-black interface with restrained gold accents. Surfaces should be dense but readable, with thin rounded borders, minimal shadow, and clear commercial hierarchy.

Primary traits:

- Deep navy or near-black page background.
- Gold Harbourview wordmark and gold interaction accents.
- Thin rounded card borders with low-contrast panels.
- Minimal elevation; avoid heavy outlines, glow, or decorative effects.
- Marketplace-first information architecture.
- Intel globe contained inside the Intel Signals column or section.
- Education visible as a credible third pillar, not a blog sidebar.

## Desktop Layout Specification

### Desktop Shell

Use a three-column dashboard layout with a persistent compact left rail.

- Page background: near-black.
- Outer page padding: `24px`.
- Main content gap: `12px` to `16px`.
- Primary content columns: Marketplace, Intel Signals, Education.
- Left rail is desktop-only and should remain visually compact.
- Avoid an overcrowded top navigation; primary navigation belongs in the left rail on desktop.

### Desktop Left Rail

The left rail contains navigation, context, and the primary posting path.

Required items, in order:

1. Gold Harbourview wordmark.
2. Dashboard.
3. Marketplace.
4. Intel Signals.
5. Education.
6. Post Listing.
7. Watchlist.
8. Messages.
9. Support.
10. Country selector or country context.
11. Role selector or role context.

Interaction rules:

- Active state uses a restrained gold accent, such as a gold left indicator, gold label, or subtle gold border.
- Hover/focus states may use elevated navy panels and gold text or border accents.
- Post Listing should be easy to locate but should not visually overpower the three-column content grid.
- Country and role context should read as operational context selectors, not marketing badges.

### Desktop Main Grid

The desktop grid has three vertical zones:

1. Column 1: Marketplace.
2. Column 2: Intel Signals.
3. Column 3: Education.

Suggested proportional emphasis:

- Marketplace: largest or densest column, approximately `38%` to `42%` of content width.
- Intel Signals: strong middle column, approximately `30%` to `34%` of content width.
- Education: credible supporting column, approximately `24%` to `28%` of content width.

If the viewport is narrower but still desktop/tablet-wide, preserve the source order: Marketplace first, Intel Signals second, Education third.

## Column 1: Marketplace

Marketplace should invite practical browsing and purchasing without implying checkout, payments, guaranteed availability, or direct seller access.

### Marketplace Header

Required elements:

- Section title: `Marketplace`.
- Header CTA: `View all listings`.
- Optional filter icon/button for compact filtering.

### Marketplace Category Chips

Use horizontal chips directly below the Marketplace header:

- All.
- Cannabis.
- Equipment.
- Consumables.
- Services.

Chip behavior:

- `All` is the default active chip.
- Active chip uses gold text or border with a subtle dark-gold fill.
- Inactive chips use muted text and thin subtle borders.
- Chips filter the visible listing preview in a future implementation, but this handoff does not define data behavior.

### Marketplace Listing Structure

Use listing cards or compact list rows. Listing rows should prioritize scannability and concrete commercial details.

Required listing fields:

- Listing image.
- Listing title.
- Category tag.
- Verification marker where applicable.
- Location.
- Price or terms.
- Save/bookmark icon.

Recommended listing examples:

- Stainless Steel Mixing Tank 500L.
- Premium Flower — Indoor Grown.
- Nutrient Solution Starter Kit.
- CO₂ Extraction System 50L.
- Child-Resistant Packaging Pouches.
- LED Grow Light.

Desktop row shape:

- Listing row height: `92px` to `120px`.
- Image ratio: square or slightly landscape thumbnail.
- Title and tags sit near the top-left of the text block.
- Location and price/terms sit below or in the right metadata rail.
- Save/bookmark icon sits at top-right or vertically centered on the right edge.

Primary marketplace CTA:

- `Browse all listings`.

## Column 2: Intel Signals

Intel Signals should be visually memorable and differentiated while remaining contained. It should not consume the whole dashboard.

### Intel Signals Header

Required elements:

- Section title: `Intel Signals`.
- Header CTA: `View all signals`.

### Heatmap Globe Module

Required elements:

- Contained heatmap globe panel.
- Heatmap selector.
- Compact legend.

Heatmap selector options:

- Demand.
- Regulatory.
- Supply Chain.
- Market Activity.

Legend labels:

- High.
- Medium.
- Low.

Globe behavior guidance:

- The globe is a module within the Intel column, not a hero background.
- It should preserve the dark navy/gold visual language from the broader Harbourview design system.
- It may show heat intensity, but must not imply live data, verified intelligence, automation, or daily refresh unless separately verified.
- Use restrained color coding and labels; avoid sci-fi, route-line clutter, city lights, or excessive glow.

### Signal Feed Structure

Place the signal feed below the globe on desktop unless the column width comfortably supports a side-by-side mini-feed without crowding.

Required signal row fields:

- Icon.
- Signal headline.
- Category tag.
- Time indicator.
- Optional chevron.

Recommended signal categories:

- Market.
- Regulation.
- Compliance.
- Supply Chain.

Signal row behavior:

- Rows should feel actionable and credible.
- Use concrete headlines without inventing intelligence claims.
- Time indicators may be relative or absolute in implementation, but should not imply a live feed cadence unless verified.

Secondary/section CTA:

- `View all intel signals` may appear below the preview list on mobile or compact layouts.

## Column 3: Education

Education is a strong third pillar and should look professional and commercially useful, not like a blog sidebar.

### Education Header

Required elements:

- Section title: `Education`.
- Header CTA: `View all resources`.

### Education Resource Card Structure

Use resource cards with either an image thumbnail or restrained icon treatment.

Required fields:

- Resource type label.
- Title.
- Duration or date.
- Difficulty level where useful.
- Optional image or icon.

Resource type labels:

- Course.
- Guide.
- Article.
- Webinar.

Recommended education examples:

- GMP Essentials for Cannabis Manufacturers.
- Exporting Cannabis from New Zealand.
- The Future of APAC Cannabis Markets.
- EU Market Access: What You Need to Know.

Card behavior:

- Cards open the relevant education resource in a future implementation.
- Do not style these as low-value blog teasers.
- Prioritize credibility: clear type labels, concise titles, practical metadata, and calm visual hierarchy.

## Mobile Layout Specification

Mobile uses a stacked vertical layout with a fixed bottom navigation.

Required order:

1. Header.
2. Marketplace.
3. Intel Signals.
4. Education.
5. Bottom navigation.

Mobile page rules:

- Page padding: `16px`.
- Card gap: `12px`.
- Panel radius: `16px` to `20px`.
- Avoid cramped text; show fewer preview rows per module than desktop.
- Marketplace must appear first and remain usable without leaving the dashboard.

### Mobile Header

Required elements:

- Gold Harbourview wordmark only.
- Notification icon.
- Account/avatar.
- Optional menu icon.
- Compact country/role context if space allows.

Header rules:

- Do not use a compass logo or icon mark.
- Keep the header compact so Marketplace starts near the top of the viewport.
- Country/role context may collapse into a single small context row or pill under the wordmark when space is limited.

### Mobile Marketplace

Required elements:

- Marketplace title.
- `View all listings` link.
- Horizontal category chips.
- Compact listing rows.
- `Browse all listings` CTA.

Mobile listing row structure:

- Listing image on the left.
- Title, category, verification marker, and location in the center.
- Price or terms on the right.
- Bookmark icon at the right edge or top-right of the row.

Mobile row dimensions:

- Listing row height: `96px` to `112px`.
- Use fewer rows than desktop to prevent Marketplace from pushing Intel and Education too far down.

### Mobile Intel Signals

Required elements:

- Intel Signals title.
- `View all signals` link.
- Compact heatmap globe module.
- Compact legend.
- Three to four signal rows.
- Optional `View all intel signals` CTA below the feed.

Mobile Intel rules:

- The globe must be compact and contained.
- The module should be visually memorable but must not displace Marketplace.
- The signal feed should be concise and readable.

### Mobile Education

Required elements:

- Education title.
- `View all resources` link.
- Horizontal resource carousel or compact two-column card grid.
- Resource type labels.
- Image or icon.
- Title.
- Duration, difficulty, or date.

Mobile Education rules:

- Prefer horizontal cards if vertical space is constrained.
- Use a two-column grid only when titles remain readable.
- Keep the visual treatment aligned with the dark premium dashboard style.

### Mobile Bottom Navigation

Use a fixed bottom navigation with five items:

1. Dashboard.
2. Marketplace.
3. Post Listing.
4. Intel Signals.
5. Education.

Bottom nav rules:

- Height: `72px` to `84px`.
- Post Listing is centered and visually prominent.
- Gold active state indicates the current section.
- Keep labels short and legible.
- Ensure content has bottom padding so the fixed nav does not cover cards or CTAs.

## Component Hierarchy

Recommended implementation hierarchy for a future build:

```text
DashboardShell
├─ DesktopLeftRail
│  ├─ Wordmark
│  ├─ PrimaryNav
│  ├─ CommercialActions
│  └─ ContextSelectors
├─ MobileHeader
│  ├─ Wordmark
│  ├─ HeaderActions
│  └─ OptionalContextPill
├─ DashboardContent
│  ├─ MarketplaceSection
│  │  ├─ SectionHeader
│  │  ├─ CategoryChipRow
│  │  ├─ ListingPreviewList
│  │  └─ BrowseListingsCta
│  ├─ IntelSignalsSection
│  │  ├─ SectionHeader
│  │  ├─ HeatmapGlobePanel
│  │  ├─ HeatmapSelector
│  │  ├─ HeatmapLegend
│  │  └─ SignalFeed
│  └─ EducationSection
│     ├─ SectionHeader
│     └─ ResourceCardList
└─ MobileBottomNavigation
```

Shared component guidance:

- `SectionHeader` supports a title and one text CTA.
- `Panel` defines dark elevated surfaces, rounded corners, and thin borders.
- `Tag` supports category and type labels without creating fake status claims.
- `IconButton` supports notifications, bookmarks, filters, chevrons, and account actions with accessible labels.
- `PrimaryCta` is used sparingly for `Browse all listings` and `Post Listing`.

## CTA Behavior

Primary CTAs:

- `Browse all listings`.
- `Post Listing`.
- `View all signals`.
- `View all resources`.

Secondary CTAs:

- Save listing.
- View marketplace.
- View intel signals.
- Open education resource.

CTA hierarchy rules:

- Marketplace and Post Listing are the strongest commercial actions.
- Do not overuse filled gold buttons.
- Header-level `View all ...` CTAs should usually be text links or subtle outlined buttons.
- Bookmark/save actions must not imply purchase, direct seller contact, or guaranteed availability.

## Responsive Behavior

Breakpoints are implementation details, but the behavior should follow this model:

- Desktop: left rail plus three content columns.
- Large tablet: left rail may remain if width allows; content can compress to two columns with Marketplace first and Intel/Education stacked or narrower.
- Small tablet/mobile: remove left rail, show mobile header, stack sections in required mobile order, and enable bottom navigation.
- Category chips scroll horizontally when they exceed available width.
- Listing rows preserve image, title, category, location, price/terms, and bookmark; secondary metadata may compress before primary commercial data is removed.
- The Intel globe scales down inside its panel and never becomes a full-screen decorative hero.
- Education cards can switch from vertical list to horizontal carousel or two-column grid based on available width.

## Color Tokens

Use these dashboard-specific approximate tokens, aligned to the dark Harbourview visual system:

| Token | Value | Usage |
|---|---:|---|
| `--dashboard-bg-primary` | `#02070D` | Page background |
| `--dashboard-bg-secondary` | `#06101A` | Rail and section background |
| `--dashboard-panel` | `#08131F` | Standard cards and panels |
| `--dashboard-panel-elevated` | `#0B1826` | Hover/elevated card state |
| `--dashboard-border-subtle` | `rgba(255,255,255,0.08)` | Thin neutral borders |
| `--dashboard-border-gold` | `rgba(212,164,74,0.45)` | Active/focus/accent borders |
| `--dashboard-gold` | `#D9A441` | Primary gold accent |
| `--dashboard-gold-bright` | `#F2C46D` | Hover/focus gold accent |
| `--dashboard-text-primary` | `#F7F1E6` | Main text |
| `--dashboard-text-secondary` | `#B8C0C8` | Supporting text |
| `--dashboard-text-muted` | `#6F7A86` | Muted metadata |
| `--dashboard-success` | `#6FCF7D` | Positive/status accent used sparingly |
| `--dashboard-warning` | `#D9A441` | Warning/medium heat accent |
| `--dashboard-risk` | `#D65C4A` | Risk/high-intensity accent used sparingly |
| `--dashboard-tag-blue` | `#3B82A0` | Market/category tag option |
| `--dashboard-tag-purple` | `#8B5FA8` | Education/resource tag option |

Color rules:

- Gold is an accent, not a large fill for every interactive element.
- Maintain high contrast for primary text and interactive labels.
- Do not use green as the primary cannabis visual cue.
- Use heatmap colors only inside the heatmap/legend context.

## Spacing and Shape Tokens

Desktop:

- Outer page padding: `24px`.
- Card gap: `12px` to `16px`.
- Panel radius: `14px` to `18px`.
- Listing row height: `92px` to `120px`.
- Borders: `1px` with subtle opacity.
- Shadows: minimal or none.

Mobile:

- Page padding: `16px`.
- Card gap: `12px`.
- Panel radius: `16px` to `20px`.
- Listing row height: `96px` to `112px`.
- Bottom nav height: `72px` to `84px`.
- Touch target minimum: align to standard accessible mobile tap targets.

## Explicit Exclusions

Do not add any of the following in this dashboard design:

- Compass logo beside Harbourview.
- Any extra brand symbol beside the gold wordmark.
- Extra charts, KPI graph blocks, pie charts, or generic analytics cards.
- Generic SaaS dashboard filler.
- Pharma market-access workflow as the main model.
- Fake testimonials.
- Fake certification claims.
- Fake automated intelligence claims.
- Claims about live automation, live payments, subscriptions, verified intelligence, daily signal cadence, production readiness, or guaranteed counterparties unless separately verified.
- Overcrowded top navigation.
- Giant decorative globe hero that displaces Marketplace.
- More than the three core dashboard pillars.
- Implementation instructions that change product scope.

## Handoff Status

This document is ready to guide a future implementation pass. Any build work should validate against the existing Harbourview design controls, preserve the three-pillar dashboard structure, and avoid adding claims or capabilities beyond this specification.
