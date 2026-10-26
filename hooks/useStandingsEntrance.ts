import { useEffect, type RefObject } from 'react';
import { onVisibleOnce, prefersReducedMotion } from '../utils/viewMotion';

/**
 * An honest on-entry reveal: the table still shows the real, current order.
 * Rows only fade in; no artificial rise/fall in ranking is implied.
 */
export function useStandingsEntrance(
  rootRef: RefObject<HTMLElement | null>,
  context: string,
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;

    const visibleRows = Array.from(
      root.querySelectorAll<HTMLElement>('[data-motion-standings-row]'),
    ).filter((row) => row.getClientRects().length > 0);

    const removeObservers = visibleRows.map((row, index) =>
      onVisibleOnce(row, () => {
        row.animate?.(
          [{ opacity: 0.45 }, { opacity: 1 }],
          {
            duration: 260,
            delay: Math.min(index, 5) * 32,
            easing: 'ease-out',
          },
        );
      }),
    );

    return () => removeObservers.forEach((remove) => remove());
  }, [context, rootRef]);
}
