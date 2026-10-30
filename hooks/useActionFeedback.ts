import { useCallback, useEffect, useRef, useState } from 'react';

export type ActionFeedbackStatus = 'IDLE' | 'COPIED' | 'SHARED' | 'FAILED';

/** Shared action feedback: reset only after an actual outcome, clear timers on unmount. */
export function useActionFeedback(): readonly [
  ActionFeedbackStatus,
  (status: ActionFeedbackStatus) => void,
] {
  const [status, setStatus] = useState<ActionFeedbackStatus>('IDLE');
  const timerRef = useRef<number | null>(null);

  const update = useCallback((nextStatus: ActionFeedbackStatus) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setStatus(nextStatus);
    if (nextStatus !== 'IDLE') {
      timerRef.current = window.setTimeout(() => {
        setStatus('IDLE');
        timerRef.current = null;
      }, 2400);
    }
  }, []);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  return [status, update] as const;
}
