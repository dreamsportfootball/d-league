import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../utils/viewMotion';

interface AnimatedScoreProps {
  identity: string;
  value: string | number;
  className?: string;
  durationMs?: number;
}

/**
 * Only animates a score changed in-place for the same match/team.
 * Initial renders and ordinary scrolling must not replay a score animation.
 */
const AnimatedScore: React.FC<AnimatedScoreProps> = ({ identity, value, className, durationMs = 220 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<{ identity: string; text: string } | null>(null);
  const text = String(value);

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
