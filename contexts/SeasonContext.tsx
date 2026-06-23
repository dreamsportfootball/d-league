import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_SEASON_ID, getSeasonConfig, isSeasonId, SEASONS } from '../config/seasons';
import { getSeasonData, type SeasonData } from '../services/seasonData';
import type { SeasonConfig, SeasonId } from '../types/season';

const STORAGE_KEY = 'dleague-active-season';

interface SeasonContextValue {
  activeSeasonId: SeasonId;
  activeSeason: SeasonConfig;
  seasonData: SeasonData;
  availableSeasons: SeasonConfig[];
  setActiveSeason: (seasonId: SeasonId) => void;
}

export const SeasonContext = createContext<SeasonContextValue | null>(null);

const getStoredSeason = (): SeasonId | null => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isSeasonId(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const SeasonProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySeason = searchParams.get('season');

  const [activeSeasonId, setActiveSeasonId] = useState<SeasonId>(() => {
    if (isSeasonId(querySeason)) return querySeason;
    return getStoredSeason() ?? DEFAULT_SEASON_ID;
  });

  useEffect(() => {
    if (isSeasonId(querySeason)) {
      if (querySeason !== activeSeasonId) setActiveSeasonId(querySeason);
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('season', activeSeasonId);
    setSearchParams(nextParams, { replace: true });
  }, [activeSeasonId, querySeason, searchParams, setSearchParams]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, activeSeasonId);
    } catch {
      // Storage may be unavailable in privacy-restricted browsers.
    }
  }, [activeSeasonId]);

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
