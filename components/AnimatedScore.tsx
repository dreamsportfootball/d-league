import React, { useEffect, useRef } from 'react';
import { onVisibleOnce, prefersReducedMotion } from '../utils/viewMotion';

interface AnimatedScoreProps {
  identity: string;
  value: string | number;
  className?: string;
  durationMs?: number;
}

/**
 * Only animates a score changed in-place for the same match/team.
 * Initial renders reveal the actual score on entry without changing its value.
 */
const AnimatedScore: React.FC<AnimatedScoreProps> = ({ identity, value, className, durationMs = 220 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<{ identity: string; text: string } | null>(null);
  const text = String(value);

  // Existing published scores gently enter when scrolled into view.
  // A placeholder becoming a score later is handled by the genuine update below.
  useEffect(() => {
    const element = ref.current;
    if (!element || !/[0-9]/.test(text) || prefersReducedMotion()) return undefined;
    return onVisibleOnce(element, () => {
      element.animate?.(
        [
          { opacity: 0.45, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 260, easing: 'ease-out' },
      );
    });
    // A new match identity receives a new entry; changes to the same match do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  useEffect(() => {
    const last = previous.current;
    previous.current = { identity, text };

    if (
      !last ||
      last.identity !== identity ||
      last.text === text ||
      prefersReducedMotion()
    ) return;

    ref.current?.animate?.(
      [
        { opacity: 0.4, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: durationMs, easing: 'ease-out' },
    );
  }, [identity, text, durationMs]);

  return <span ref={ref} className={['inline-block', className].filter(Boolean).join(' ')}>{text}</span>;
};

export default AnimatedScore;
