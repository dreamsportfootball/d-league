# Preview / Production parity audit — 2026-09-01

This audit verifies that Preview and Production use the same product state and page content.

## Shared product state

- Current operating season: 2026/27
- Season status comes from `config/seasons.ts`
- Registration navigation comes from `config/siteConfig.ts`
- Hero behavior no longer depends on preview-only environment flags

## Allowed deployment-only differences

- Preview uses HashRouter and its preview base path
- Production uses BrowserRouter under `/d-league/`
- Preview analytics collection is disabled
- Production analytics collection is enabled

## Audited routes

Responsive visual audit covers:

- Home
- Registration / season information
- Schedule & results
- Standings
- Stats center
- News
- Article detail
- Team page
- Player page
- Match permalink
- Media
- Cup
- About

Viewports: 375, 390, 768, 1024, 1280, 1440.

The purpose of this file is documentation only; it does not alter runtime behavior.
