# D LEAGUE · Hallmark-informed full-site visual trial

Date: 2026-11-11. Owner review required before any production merge.

## Baseline and isolation
- Approved production base commit: `69ea147e214ba0c8041d3869fc5fe9f99f8e2e86` on `master`.
- Branch: `design/hallmark-full-site-preview-20261111`.
- Preview build path: `/d-league/preview/hallmark-20261111/`, with hash routing and analytics disabled.
- Never merge automatically or run the production workflow for trial approval.
- **Rollback**: reject/close this draft PR and delete the design branch. Since `master` is not changed, nothing needs restoring in production. If someone later merges, revert the corresponding merge commit/PR, validate, and deploy.

## Design prompt / brief
Deliver a premium, football-first competition editorial experience rather than generic AI-generated card grids. Preserve D LEAGUE brand typography (Inter interface, Oswald display) and genuine palette (black/white, blue #0047AB, limited lime #CCFF00). Use real existing photographic and club assets. Prioritize match times, team names, scores, standings and clear navigation above decoration. Use meaningful dense data tables, large readable mobile team names and lighter borders instead of glossy gradients/shadows. Let existing media, match results and event identity carry the story; no fictional metrics, sponsor walls or testimonials.

### Protected behavior
- Season, league, team, player, match and cup data, rankings and tie breakers.
- Match dialogs, query-parameter navigation, scroll restoration, filters, history, kits, player portrait positioning, SEO and analytics on the official site.
- Existing social, media and partner links, published content and asset ownership.
- Preserve dedicated Cup identity, rather than force a generic brand style across the cup.

## Changes
- Scoped `dl-editorial-v2` visual trial on app root, shared design tokens and footer/header, editorial masthead for current season poster, updated action bar.
- Reworked home match center, rankings, news, participant team gallery, actual photo gallery and league story.
- Expanded team name and score legibility in mobile listings; shared data/content pages inherit the same surfaces while preserving original data logic.
- Preview-only GitHub Actions workflow separated from existing production and active-season preview paths.

## Acceptance gates
- Run `npm ci`, `npm run typecheck`, `npm run validate:data` and `npm run build:site`.
- Visual/interactive audit: 320, 375, 390, 414, 768, 1024, 1280, 1440, 1920px, preserving existing 390px test baseline.
- Inspect homepage, schedule, standings, stats, teams, players, media, news, registration, cup and about pages.
- Verify no horizontal overflow except intentional carousels, tappable 44px controls, focus outlines, modal scroll lock, back navigation, season filters and portrait cropping.
- Verify no missing images, oversized poster fold or unreadable content on mobile. Fix issues before production.
- Do not claim production or browser QA passed without successful CI evidence.

## Safety
Hallmark design principles were read and applied manually; the third-party Hallmark package was not installed or executed. No image-generation API was called. GitHub production branch and site must remain unchanged until explicit user approval.
