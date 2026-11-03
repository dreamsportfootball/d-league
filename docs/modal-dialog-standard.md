# Modal / drawer interaction standard

This policy applies to all D LEAGUE overlays: match dialogs, media albums, filters, popups, and mobile navigation.

## Background scroll

- Always use `useModalScrollLock(isOpen)`. Do **not** directly set `document.body.style.overflow`, `document.documentElement.style.overflow`, or `scrollbarGutter` in components/pages.
- Use `useModalScrollLock(isOpen, 'fixed')` only when a native/mobile dialog requires fixed-body scroll restoration (currently the media album).
- The central utility (`utils/modalScrollLock.ts`) reference-counts nested overlays, reserves only an existing scrollbar gutter, and restores original inline styles after the last lock.
- Keep the dialog's own scrolling and keyboard/focus management; the scroll-lock hook does not replace focus trapping or the match dialog's Safari touch boundary handling.
- If a new overlay opens over another, closing either one must not unlock the background prematurely.

## Match detail return behavior

- Use `useMatchDialogQuery(validMatchIds)` from every route that opens a match dialog. The validation IDs must come from the route's **correct season context**, never from global/current-season fallback data.
- The hook persists the chosen `match` search parameter in the source history entry. After navigating to a player/team profile, in-page back and browser back reopen the **same** match, rather than just the underlying page.
- `selectMatch` updates the match parameter; `closeMatch` removes only that parameter while preserving season, filters, and other search parameters.
- Default: replace the current history entry to avoid adding a back-button step solely for opening a modal. Schedule may explicitly use `{ replaceOnOpen: false }` to preserve its existing navigation history.
- All `?match=` transitions on the same route must preserve background scroll position; this is handled by `ScrollMemory` in `App.tsx`.
- Do not close the source match explicitly when a dialog link navigates to a profile; route unmount naturally releases its lock. Keep direct match permalinks functional.

## Regression gates

- `scripts/tests/modal-scroll-lock.test.mjs`: nested-lock order, classic vs overlay scrollbars, fixed-body restoration.
- `scripts/tests/modal-architecture.test.mjs`: reject direct page/component scroll-style writes.
- `scripts/validate-home-match-dialog-return.mjs`: homepage player/team return, browser back, modal close, mobile/desktop widths.
- `scripts/validate-shared-match-dialog-return.mjs`: schedule, team, round, and player return routes.
- `scripts/validate-match-dialog-scroll-stability.mjs`: scroll and layout drift on 375, 390, 768, 1024, 1280 and 1440px viewports.

Do not change accepted visual styles, operational season settings, historical data, or GitHub Pages routing while implementing this infrastructure.
