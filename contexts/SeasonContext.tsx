import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getSeasonConfig, isSeasonId, SEASONS } from '../config/seasons';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { getSeasonData, type SeasonData } from '../services/seasonDataJson';
import type { SeasonConfig, SeasonId } from '../types/season';

interface SeasonContextValue {
  activeSeasonId: SeasonId;
  activeSeason: SeasonConfig;
  seasonData: SeasonData;
  availableSeasons: SeasonConfig[];
  setActiveSeason: (seasonId: SeasonId) => void;
}

const SEASON_AWARE_PATHS = ['/schedule', '/standings', '/stats', '/media'] as const;

const isSeasonAwarePath = (pathname: string): boolean =>
  SEASON_AWARE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export const SeasonContext = createContext<SeasonContextValue | null>(null);

export const SeasonProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySeason = searchParams.get('season');
  const seasonAware = isSeasonAwarePath(location.pathname);

  const [activeSeasonId, setActiveSeasonId] = useState<SeasonId>(() =>
    seasonAware && isSeasonId(querySeason) ? querySeason : CURRENT_SEASON_ID,
  );

  useEffect(() => {
    if (!seasonAware) {
      if (activeSeasonId !== CURRENT_SEASON_ID) {
        setActiveSeasonId(CURRENT_SEASON_ID);
      }

      if (searchParams.has('season')) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('season');
        setSearchParams(nextParams, { replace: true });
      }
      return;
    }

    if (isSeasonId(querySeason)) {
      if (querySeason !== activeSeasonId) setActiveSeasonId(querySeason);
      return;
    }

    const fallbackSeason = querySeason === null ? activeSeasonId : CURRENT_SEASON_ID;
    if (fallbackSeason !== activeSeasonId) setActiveSeasonId(fallbackSeason);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('season', fallbackSeason);
    setSearchParams(nextParams, { replace: true });
  }, [activeSeasonId, querySeason, searchParams, seasonAware, setSearchParams]);

  const setActiveSeason = useCallback(
    (seasonId: SeasonId) => {
      if (!seasonAware) return;

      setActiveSeasonId(seasonId);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('season', seasonId);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, seasonAware, setSearchParams],
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
