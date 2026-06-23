import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_SEASON_ID, getSeasonConfig, isSeasonId, SEASONS } from '../config/seasons';
import { getSeasonData, type SeasonData } from '../services/seasonDataJson';
import type { SeasonConfig, SeasonId } from '../types/season';

interface SeasonContextValue {
  activeSeasonId: SeasonId;
  activeSeason: SeasonConfig;
  seasonData: SeasonData;
  availableSeasons: SeasonConfig[];
  setActiveSeason: (seasonId: SeasonId) => void;
}

export const SeasonContext = createContext<SeasonContextValue | null>(null);

export const SeasonProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySeason = searchParams.get('season');

  const [activeSeasonId, setActiveSeasonId] = useState<SeasonId>(() =>
    isSeasonId(querySeason) ? querySeason : DEFAULT_SEASON_ID,
  );

  useEffect(() => {
    if (isSeasonId(querySeason)) {
      if (querySeason !== activeSeasonId) setActiveSeasonId(querySeason);
      return;
    }

    if (activeSeasonId !== DEFAULT_SEASON_ID) {
      setActiveSeasonId(DEFAULT_SEASON_ID);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('season', DEFAULT_SEASON_ID);
    setSearchParams(nextParams, { replace: true });
  }, [activeSeasonId, querySeason, searchParams, setSearchParams]);

  const setActiveSeason = useCallback(
    (seasonId: SeasonId) => {
      setActiveSeasonId(seasonId);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('season', seasonId);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const value = useMemo<SeasonContextValue>(
    () => ({
      activeSeasonId,
      activeSeason: getSeasonConfig(activeSeasonId),
      seasonData: getSeasonData(activeSeasonId),
      availableSeasons: Object.values(SEASONS),
      setActiveSeason,
    }),
    [activeSeasonId, setActiveSeason],
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
};
