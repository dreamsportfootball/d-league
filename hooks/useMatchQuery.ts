import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useMatchQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMatchId = searchParams.get('match');

  const openMatch = useCallback(
    (matchId: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('match', matchId);
      setSearchParams(nextParams, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const closeMatch = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('match');
    setSearchParams(nextParams, { replace: false });
  }, [searchParams, setSearchParams]);

  return { selectedMatchId, openMatch, closeMatch };
};
