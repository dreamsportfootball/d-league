# D LEAGUE Design Language

D LEAGUE uses a restrained football-competition editorial system: white and near-black surfaces, brand blue for active state and hierarchy, fluorescent green only as a high-energy accent, Oswald for display moments, and Inter for interface/body copy. Data pages stay dense and scan-friendly; imagery and competition data carry the personality rather than decorative UI.

> One-liner: use `Inter` for interface/body and `Oswald` for display headings, build on white/neutral surfaces with `brand-blue` as the main interactive accent and `brand-accent` as a limited highlight, keep data layouts wide and structured rather than card-heavy, preserve 44px mobile hit areas, use Lucide icons, and prefer borders/spacing/typography over gradients, glass, or decorative effects.

The shared tokens are defined in [styles.css](styles.css). Fonts are loaded in [index.html](index.html). Representative surfaces are [components/SeasonPageHeader.tsx](components/SeasonPageHeader.tsx), [components/MatchCenter.tsx](components/MatchCenter.tsx), [components/FullSchedule.tsx](components/FullSchedule.tsx), and [pages/PlayerPage.tsx](pages/PlayerPage.tsx).

## 1. Foundations

### Fonts

- **Inter** — loaded in [index.html](index.html) and mapped to `font-sans` in [styles.css](styles.css). Use for body copy, labels, controls, tables, and navigation.
- **Oswald** — loaded in [index.html](index.html) and mapped to `font-display` in [styles.css](styles.css). Use for page titles, scorelines, rankings, player numbers, and short competition labels.
- Budget: one dominant display-heading moment per section; long-form body copy stays in Inter.

### Color

Defined in [styles.css](styles.css).

| Role | Token |
| --- | --- |
| Page canvas / surface | `brand-white` / white |
| Primary text | `brand-black` |
| Secondary text | neutral 400–600 |
| Primary interactive accent | `brand-blue` |
| High-energy accent | `brand-accent` |
| Dark footer / inverse surface | neutral 950 / `brand-dark` |

Use blue for active navigation, links, rankings, filters, and data emphasis. Reserve fluorescent green for limited promotional/high-energy accents such as footer details or campaign CTA moments. Do not introduce new decorative gradients unless a specific campaign brief requires one.

### Elevation

The normal hierarchy is **border first, shadow second**. Small interactive surfaces use `border-neutral-200` plus `shadow-sm`; stronger shadows are reserved for overlays, menus, and elevated homepage modules. See [components/MatchCenter.tsx](components/MatchCenter.tsx) and [components/ResponsiveFilterDrawer.tsx](components/ResponsiveFilterDrawer.tsx).

## 2. Surfaces & rounding

- `rounded-lg`: standard controls, selectors, compact cards, mobile controls.
- `rounded-xl`: elevated homepage modules and larger media surfaces.
- `rounded-full`: small compact controls only (social buttons, compact segmented controls).
- Large data sections should usually use dividers and whitespace instead of wrapping every block in a card.

## 3. Typography patterns

| Element | Existing pattern |
| --- | --- |
| Data-page title | `font-display text-[32px] font-extrabold uppercase ... md:text-6xl` in [components/SeasonPageHeader.tsx](components/SeasonPageHeader.tsx) |
| Section title | `font-display text-2xl/3xl font-black` |
| Body / description | Inter, neutral 500–600, relaxed line height |
| Small competition label | uppercase, bold, increased tracking |
| Scores / changing stats | `font-display ... tabular-nums` |
| Active state | brand blue + weight / underline / border, never color alone when state needs another cue |

Use `text-pretty` on short descriptions and editorial card copy where wrapping benefits. Keep long-form article copy naturally readable rather than edge-to-edge on large screens.

## 4. Layout & spacing

- Data pages use the shared header structure in [components/SeasonPageHeader.tsx](components/SeasonPageHeader.tsx) and containers such as `max-w-7xl px-4 md:px-12`.
- Homepage sections commonly use `container mx-auto px-4 md:px-6`.
- Mobile layouts must not introduce horizontal page scrolling; horizontal scrolling is reserved for intentional content strips such as match/media carousels.
- Touch controls should preserve a minimum 44px hit area.
- Use spacing to separate information levels; do not convert every information group into a card.

## 5. Components & motifs

- **Navigation:** [components/Header.tsx](components/Header.tsx) uses centered desktop navigation with blue active-state indication and a mobile disclosure menu.
- **Season/data header:** [components/SeasonPageHeader.tsx](components/SeasonPageHeader.tsx) is the canonical data-page heading.
- **Season selection:** [components/SeasonSelector.tsx](components/SeasonSelector.tsx) is custom UI; do not replace it with a native `select` for the current design.
- **Tabs:** [components/Tabs.tsx](components/Tabs.tsx) supports standard text tabs and compact controls. Data-center category tabs remain text-led.
- **Filters:** [components/ResponsiveFilterDrawer.tsx](components/ResponsiveFilterDrawer.tsx) owns mobile/desktop data filtering.
- **Icons:** Lucide React is the icon language. Decorative icons should be hidden from assistive technology; icon-only controls require an accessible label.
- **Numbers:** Scores, rankings, shirt numbers, counters, and table values use `tabular-nums` where alignment matters.

## 6. Motion

Reduced-motion handling is global in [styles.css](styles.css). Interactive motion should use named transition properties (`transition-colors`, `transition-transform`, `transition-shadow`, or explicit property lists) instead of broad `transition-all` when touching a component.

- Hover feedback is subtle: color, border, shadow, or small icon movement.
- Do not make content jump in layout during hover.
- Menus and drawers should remain interruptible and keyboard-operable.
- Preserve `prefers-reduced-motion` behavior.

## 7. Per-page checklist

- [ ] Uses Inter for body/interface and Oswald only for established display roles.
- [ ] Uses existing brand tokens from [styles.css](styles.css); no new arbitrary brand colors.
- [ ] Primary interactive state uses brand blue; fluorescent green remains limited.
- [ ] Data sections use dividers/spacing before introducing new cards.
- [ ] Mobile controls keep at least 44px hit areas and no accidental horizontal page scroll.
- [ ] Keyboard focus is visible on interactive controls.
- [ ] Lucide icons are used instead of Unicode/emoji controls.
- [ ] Scores and changing numeric data use `tabular-nums` where alignment matters.
- [ ] Motion respects reduced-motion and avoids unnecessary layout movement.
- [ ] Existing season/history behavior is not changed by purely visual work.

## Open questions

- Some older components still use broad `transition-all`; migrate only when those components are already being edited.
- Radius and shadow usage is intentionally mixed by surface type. Do not normalize the entire site into one card style.
