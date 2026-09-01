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

const CONTROLLED_SEASON_PATHS = ['/schedule', '/standings', '/stats', '/media'] as const;
const ENTITY_PATHS = ['/teams', '/players', '/matches'] as const;
const PREVIEW_SEASON_STATUS = import.meta.env.VITE_PREVIEW_SEASON_STATUS;

const matchesPath = (pathname: string, paths: readonly string[]): boolean =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export const SeasonContext = createContext<SeasonContextValue | null>(null);

export const SeasonProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySeason = searchParams.get('season');
  const controlledSeason = matchesPath(location.pathname, CONTROLLED_SEASON_PATHS);
  const entityPath = matchesPath(location.pathname, ENTITY_PATHS);
  const keepsSeasonQuery = controlledSeason || entityPath;

  const [selectedSeasonId, setSelectedSeasonId] = useState<SeasonId>(() =>
    keepsSeasonQuery && isSeasonId(querySeason) ? querySeason : CURRENT_SEASON_ID,
  );

  useEffect(() => {
    if (controlledSeason) {
      if (isSeasonId(querySeason)) {
        if (querySeason !== selectedSeasonId) setSelectedSeasonId(querySeason);
        return;
      }

      if (selectedSeasonId !== CURRENT_SEASON_ID) setSelectedSeasonId(CURRENT_SEASON_ID);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('season', CURRENT_SEASON_ID);
      setSearchParams(nextParams, { replace: true });
      return;
    }

    if (entityPath) {
      const nextSeason = isSeasonId(querySeason) ? querySeason : CURRENT_SEASON_ID;
      if (nextSeason !== selectedSeasonId) setSelectedSeasonId(nextSeason);
      return;
    }

    if (selectedSeasonId !== CURRENT_SEASON_ID) setSelectedSeasonId(CURRENT_SEASON_ID);
    if (searchParams.has('season')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('season');
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    controlledSeason,
    entityPath,
    querySeason,
    searchParams,
    selectedSeasonId,
    setSearchParams,
  ]);

  const setActiveSeason = useCallback(
    (seasonId: SeasonId) => {
      if (!controlledSeason) return;
      setSelectedSeasonId(seasonId);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('season', seasonId);
      setSearchParams(nextParams, { replace: true });
    },
    [controlledSeason, searchParams, setSearchParams],
  );

  const activeSeasonId =
    keepsSeasonQuery && isSeasonId(querySeason)
      ? querySeason
      : controlledSeason
        ? selectedSeasonId
        : CURRENT_SEASON_ID;

  const value = useMemo<SeasonContextValue>(() => {
    const configuredSeason = getSeasonConfig(activeSeasonId);
    const previewingActiveCurrentSeason =
      activeSeasonId === CURRENT_SEASON_ID && PREVIEW_SEASON_STATUS === 'active';
    const activeSeason: SeasonConfig = previewingActiveCurrentSeason
      ? {
          ...configuredSeason,
          status: 'active',
        }
      : configuredSeason;

    return {
      activeSeasonId,
      activeSeason,
      seasonData: getSeasonData(activeSeasonId),
      availableSeasons: Object.values(SEASONS),
      setActiveSeason,
    };
  }, [activeSeasonId, setActiveSeason]);

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
};
