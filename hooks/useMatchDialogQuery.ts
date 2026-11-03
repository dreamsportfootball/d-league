import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface MatchDialogQueryOptions {
  /** Schedule retains its original push-history behavior; other pages replace. */
  replaceOnOpen?: boolean;
}

/**
 * Keep match-modal state in the current route. A profile link then creates a
 * new history entry, so browser or in-page back can reopen the same match.
 * The calling page validates IDs in its own season/league context.
 */
export const useMatchDialogQuery = (
  validMatchIds: ReadonlySet<string>,
  { replaceOnOpen = true }: MatchDialogQueryOptions = {},
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMatchId = searchParams.get('match');
  const matchId = requestedMatchId && validMatchIds.has(requestedMatchId)
    ? requestedMatchId
    : null;

  const selectMatch = useCallback((nextMatchId: string) => {
    if (!validMatchIds.has(nextMatchId)) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('match', nextMatchId);
      return next;
    }, { replace: replaceOnOpen });
  }, [replaceOnOpen, setSearchParams, validMatchIds]);

  const closeMatch = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('match');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return useMemo(() => ({ matchId, selectMatch, closeMatch }), [matchId, selectMatch, closeMatch]);
};
