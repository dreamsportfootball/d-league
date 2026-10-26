import { useLayoutEffect, useRef, type RefObject } from 'react';

interface RankedItem {
  teamId: string;
  rank: number;
}

/**
 * Shared ranking motion for actual standings and the isolated review demo.
 * No animation for first paint, context switches, or reduced-motion users.
 */
export function useRankingMotion(
  containerRef: RefObject<HTMLElement | null>,
  context: string,
  rows: readonly RankedItem[],
  durationMs = 240,
): void {
  const previousLayoutRef = useRef<{
    context: string;
    ranks: Map<string, number>;
    positions: Map<string, number>;
  } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ranks = new Map(rows.map((row) => [row.teamId, row.rank]));
    const top = container.getBoundingClientRect().top;
    const elements = Array.from(container.querySelectorAll('[data-motion-standings-row]')) as HTMLElement[];
    const positions = new Map(elements.map((element) => [
      element.dataset.motionStandingsRow ?? '',
      element.getBoundingClientRect().top - top,
    ]));
    const previous = previousLayoutRef.current;
    const hasRankChange = previous?.context === context &&
      rows.some((row) =>
        previous.ranks.has(row.teamId) && previous.ranks.get(row.teamId) !== row.rank,
      );

    if (hasRankChange && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => {
        if (element.getBoundingClientRect().width === 0) return;
        const key = element.dataset.motionStandingsRow ?? '';
        const before = previous.positions.get(key);
        const after = positions.get(key);
        if (before === undefined || after === undefined) return;
        const delta = before - after;
        if (Math.abs(delta) < 2 || Math.abs(delta) > 600) return;
        element.animate?.(
          [
            { transform: `translateY(${delta}px)` },
            { transform: 'translateY(0)' },
          ],
          { duration: durationMs, easing: 'ease-out' },
        );
      });
    }
    previousLayoutRef.current = { context, ranks, positions };
  });
}
