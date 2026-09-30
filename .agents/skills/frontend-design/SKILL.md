---
name: frontend-design
description: Craft doctrine for building distinctive, polished frontend interfaces. Use when building or reviewing web UI — components, pages, layouts, styling, animation. Covers design direction, typography, surfaces, and motion. Defers to the repo's DESIGN.md for all project-specific choices.
---

Great interfaces are a collection of small, intentional details that compound. Apply this doctrine when building or reviewing any UI.

**DESIGN.md wins.** If this repo has a `DESIGN.md`, its fonts, tokens, budgets, and recipes override everything below — this skill covers the craft layer underneath any design language. Express every change in the styling system the project already uses; never introduce a second one for a fix.

## Direction

Before coding a new surface, commit to a clear aesthetic point of view — the repo's `DESIGN.md` if one exists, otherwise a deliberate choice for the context. Intentionality matters more than intensity. Never ship generic AI aesthetics or cookie-cutter card grids with no context-specific character.

## Typography

- Few fonts, few weights. Pair for contrast, not similarity.
- Sizes come from the project's type scale.
- Headings use tighter line-height; body copy stays comfortable.
- Use `text-wrap: balance` on headings and `text-wrap: pretty` on short descriptions when appropriate.
- Use `tabular-nums` on timers, counters, scores, prices, and aligned numeric columns.
- Keep inputs at least 16px on mobile to avoid iOS zoom.
- Maintain readable contrast and line length.

## Surfaces

- Keep nested radii visually coherent.
- Prefer the project's existing border/shadow recipes instead of inventing new elevation.
- Preserve image aspect ratios and reserve layout space to avoid shift.
- Hit areas should be at least 44×44px on touch surfaces.
- Do not turn every section into a card.

## Motion

- Interactive motion should be interruptible.
- Use specific transition properties rather than `transition-all`.
- Keep hover/press effects subtle enough that surrounding layout does not move.
- Respect `prefers-reduced-motion`.
- Animation must communicate state or hierarchy, not exist only to make polish visible.

## Review checklist

- [ ] Fonts, tokens, and budgets match `DESIGN.md`.
- [ ] Typography hierarchy is consistent with existing surfaces.
- [ ] Long-form content has a readable measure.
- [ ] `tabular-nums` is used on changing/aligned numerical data.
- [ ] Hit areas meet the repo's mobile target size.
- [ ] Focus is visible and keyboard operation remains intact.
- [ ] Icons use the established icon system.
- [ ] Interactive motion is specific, stable, and reduced-motion safe.
- [ ] No generic redesign overrides a confirmed D LEAGUE pattern.
