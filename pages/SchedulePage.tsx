import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import MatchDialog from '../components/MatchDialog';
import SeasonPageHeader from '../components/SeasonPageHeader';
import { useSeason } from '../hooks/useSeason';
import { getSeasonData } from '../services/seasonDataJson';
import type { Match } from '../types';
import { MatchStatus } from '../types';
import type { LeagueId, SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';

type LeagueFilter = LeagueId | 'ALL';
type StatusFilter = 'ALL' | 'UPCOMING' | 'FINISHED';
type MobileFilterView = 'ROOT' | 'SEASON' | 'LEAGUE' | 'STATUS' | 'TEAM' | 'DATE' | 'ROUND';
type DesktopFilterView = 'ROOT' | 'SEASON' | 'LEAGUE' | 'STATUS' | 'TEAM' | 'DATE' | 'ROUND';
type FacetKey = 'league' | 'team' | 'round' | 'date' | 'status';

interface ScheduleFilters {
  league: LeagueFilter;
  team: string;
  round: string;
  date: string;
  status: StatusFilter;
}

interface FacetOptions {
  leagueIds: LeagueId[];
  teams: SeasonTeam[];
  rounds: string[];
  dates: string[];
  statuses: StatusFilter[];
}

interface ScheduleFilterDraft {
  seasonId: SeasonId;
  filters: ScheduleFilters;
}

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectorConfig {
  title: string;
  selectedValue: string;
  options: FilterSelectOption[];
  onSelect: (value: string) => void;
}

const EMPTY_FILTERS: ScheduleFilters = {
  league: 'ALL',
  team: 'ALL',
  round: 'ALL',
  date: 'ALL',
  status: 'ALL',
};

const matchPassesFilters = (
  match: Match,
  filters: ScheduleFilters,
  excludedFacet?: FacetKey,
): boolean => {
  if (excludedFacet !== 'league' && filters.league !== 'ALL' && match.league !== filters.league) {
    return false;
  }
  if (
    excludedFacet !== 'team' &&
    filters.team !== 'ALL' &&
    match.homeTeamId !== filters.team &&
    match.awayTeamId !== filters.team
  ) {
    return false;
  }
  if (excludedFacet !== 'round' && filters.round !== 'ALL' && String(match.round) !== filters.round) {
    return false;
  }
  if (excludedFacet !== 'date' && filters.date !== 'ALL' && !match.timestamp.startsWith(filters.date)) {
    return false;
  }
  if (excludedFacet !== 'status') {
    if (filters.status === 'UPCOMING' && match.status !== MatchStatus.SCHEDULED) return false;
    if (filters.status === 'FINISHED' && match.status !== MatchStatus.FINISHED) return false;
  }
  return true;
};

const getFacetOptions = (
  matches: Match[],
  teams: SeasonTeam[],
  filters: ScheduleFilters,
  enabledLeagues: LeagueId[],
): FacetOptions => {
  const leagueIdsWithMatches = new Set(
    matches
      .filter((match) => matchPassesFilters(match, filters, 'league'))
      .map((match) => match.league),
  );
  const leagueIds = enabledLeagues.filter((leagueId) => leagueIdsWithMatches.has(leagueId));

  const teamIds = new Set<string>();
  matches
    .filter((match) => matchPassesFilters(match, filters, 'team'))
    .forEach((match) => {
      teamIds.add(match.homeTeamId);
      teamIds.add(match.awayTeamId);
    });
  const availableTeams = teams
    .filter((team) => teamIds.has(team.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

  const rounds = [...new Set(
    matches
      .filter((match) => matchPassesFilters(match, filters, 'round'))
      .map((match) => String(match.round)),
  )].sort((a, b) => Number(a) - Number(b));

  const dates = [...new Set(
    matches
      .filter((match) => matchPassesFilters(match, filters, 'date'))
      .map((match) => match.timestamp.split('T')[0]),
  )].sort();

  const statusMatches = matches.filter((match) => matchPassesFilters(match, filters, 'status'));
  const statuses: StatusFilter[] = ['ALL'];
  if (statusMatches.some((match) => match.status === MatchStatus.FINISHED)) statuses.push('FINISHED');
  if (statusMatches.some((match) => match.status === MatchStatus.SCHEDULED)) statuses.push('UPCOMING');

  return { leagueIds, teams: availableTeams, rounds, dates, statuses };
};

const isFacetValueAvailable = (
  facet: FacetKey,
  value: string,
  matches: Match[],
  filters: ScheduleFilters,
): boolean => {
  if (value === 'ALL') return true;
  const candidateFilters = { ...filters, [facet]: value } as ScheduleFilters;
  return matches.some((match) => matchPassesFilters(match, candidateFilters));
};

const reconcileFilters = (
  proposedFilters: ScheduleFilters,
  changedFacet: FacetKey,
  matches: Match[],
): ScheduleFilters => {
  const nextFilters = { ...proposedFilters };
  const facets: FacetKey[] = ['league', 'status', 'team', 'date', 'round'];

  for (let pass = 0; pass < facets.length; pass += 1) {
    let changed = false;
    for (const facet of facets) {
      if (facet === changedFacet || nextFilters[facet] === 'ALL') continue;
      if (!isFacetValueAvailable(facet, nextFilters[facet], matches, nextFilters)) {
        nextFilters[facet] = 'ALL';
        changed = true;
      }
    }
    if (!changed) break;
  }

  return nextFilters;
};

const getStatusSummary = (status: StatusFilter): string => {
  if (status === 'FINISHED') return '已完賽';
  if (status === 'UPCOMING') return '即將開賽';
  return '全部狀態';
};

const SchedulePage: React.FC = () => {
  const {
    activeSeasonId,
    activeSeason,
    seasonData,
    availableSeasons,
    setActiveSeason,
  } = useSeason();
  const [searchParams, setSearchParams] = useSearchParams();
  const previousSeasonIdRef = useRef(activeSeasonId);
  const desktopFilterRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<ScheduleFilters>(() => {
    let savedLeague: LeagueFilter = 'ALL';
    try {
      const saved = window.sessionStorage.getItem('scheduleActiveLeague');
      if (saved === 'L1' || saved === 'L2' || saved === 'L3') savedLeague = saved;
    } catch {
      // Session storage may be unavailable.
    }
    return {
      ...EMPTY_FILTERS,
      league: savedLeague !== 'ALL' && activeSeason.enabledLeagues.includes(savedLeague)
        ? savedLeague
        : 'ALL',
    };
  });
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [desktopFilterView, setDesktopFilterView] = useState<DesktopFilterView>('ROOT');
  const [desktopDraft, setDesktopDraft] = useState<ScheduleFilterDraft>({
    seasonId: activeSeasonId,
    filters: { ...EMPTY_FILTERS },
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFilterView, setMobileFilterView] = useState<MobileFilterView>('ROOT');
  const [mobileDraft, setMobileDraft] = useState<ScheduleFilterDraft>({
    seasonId: activeSeasonId,
    filters: { ...EMPTY_FILTERS },
  });

  const selectedMatchId = searchParams.get('match');
  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const filteredMatches = useMemo(
    () => seasonData.matches.filter((match) => matchPassesFilters(match, filters)),
    [filters, seasonData.matches],
  );

  const desktopDraftSeason = availableSeasons.find((season) => season.id === desktopDraft.seasonId) ?? activeSeason;
  const desktopDraftSeasonData = getSeasonData(desktopDraft.seasonId);
  const desktopDraftFacetOptions = useMemo(
    () => getFacetOptions(
      desktopDraftSeasonData.matches,
      desktopDraftSeasonData.teams,
      desktopDraft.filters,
      desktopDraftSeason.enabledLeagues,
    ),
    [
      desktopDraft.filters,
      desktopDraftSeason.enabledLeagues,
      desktopDraftSeasonData.matches,
      desktopDraftSeasonData.teams,
    ],
  );
  const desktopDraftFilteredMatches = useMemo(
    () => desktopDraftSeasonData.matches.filter((match) => matchPassesFilters(match, desktopDraft.filters)),
    [desktopDraft.filters, desktopDraftSeasonData.matches],
  );

  const mobileDraftSeason = availableSeasons.find((season) => season.id === mobileDraft.seasonId) ?? activeSeason;
  const mobileDraftSeasonData = getSeasonData(mobileDraft.seasonId);
  const mobileDraftFacetOptions = useMemo(
    () => getFacetOptions(
      mobileDraftSeasonData.matches,
      mobileDraftSeasonData.teams,
      mobileDraft.filters,
      mobileDraftSeason.enabledLeagues,
    ),
    [
      mobileDraft.filters,
      mobileDraftSeason.enabledLeagues,
      mobileDraftSeasonData.matches,
      mobileDraftSeasonData.teams,
    ],
  );
  const mobileDraftFilteredMatches = useMemo(
    () => mobileDraftSeasonData.matches.filter((match) => matchPassesFilters(match, mobileDraft.filters)),
    [mobileDraft.filters, mobileDraftSeasonData.matches],
  );

  useEffect(() => {
    if (previousSeasonIdRef.current === activeSeasonId) return;
    previousSeasonIdRef.current = activeSeasonId;
    setFilters({ ...EMPTY_FILTERS });
    setDesktopFiltersOpen(false);
    setDesktopFilterView('ROOT');
    try {
      window.sessionStorage.setItem('scheduleActiveLeague', 'ALL');
    } catch {
      // Session storage may be unavailable.
    }
  }, [activeSeasonId]);

  useEffect(() => {
    if (selectedMatchId && !seasonData.matches.some((match) => match.id === selectedMatchId)) {
      const next = new URLSearchParams(searchParams);
      next.delete('match');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, seasonData.matches, selectedMatchId, setSearchParams]);

  useEffect(() => {
    if (!desktopFiltersOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && desktopFilterRef.current?.contains(target)) return;
      setDesktopFilterView('ROOT');
      setDesktopFiltersOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDesktopFilterView('ROOT');
      setDesktopFiltersOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [desktopFiltersOpen]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (mobileFilterView !== 'ROOT') {
          setMobileFilterView('ROOT');
        } else {
          setMobileFiltersOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileFilterView, mobileFiltersOpen]);

  const closeDesktopFilters = () => {
    setDesktopFilterView('ROOT');
    setDesktopFiltersOpen(false);
  };

  const updateDesktopDraftFacet = (facet: FacetKey, value: string) => {
    setDesktopDraft((currentDraft) => {
      if (currentDraft.filters[facet] === value) return currentDraft;
      const currentData = getSeasonData(currentDraft.seasonId);
      const proposedFilters = { ...currentDraft.filters, [facet]: value } as ScheduleFilters;
      return {
        ...currentDraft,
        filters: reconcileFilters(proposedFilters, facet, currentData.matches),
      };
    });
  };

  const updateMobileDraftFacet = (facet: FacetKey, value: string) => {
    setMobileDraft((currentDraft) => {
      if (currentDraft.filters[facet] === value) return currentDraft;
      const currentData = getSeasonData(currentDraft.seasonId);
      const proposedFilters = { ...currentDraft.filters, [facet]: value } as ScheduleFilters;
      return {
        ...currentDraft,
        filters: reconcileFilters(proposedFilters, facet, currentData.matches),
      };
    });
  };

  const openDesktopFilters = () => {
    setDesktopDraft({ seasonId: activeSeasonId, filters: { ...filters } });
    setDesktopFilterView('ROOT');
    setDesktopFiltersOpen(true);
  };

  const toggleDesktopFilters = () => {
    if (desktopFiltersOpen) {
      closeDesktopFilters();
      return;
    }
    openDesktopFilters();
  };

  const applyDesktopFilters = () => {
    previousSeasonIdRef.current = desktopDraft.seasonId;
    if (desktopDraft.seasonId !== activeSeasonId) {
      setActiveSeason(desktopDraft.seasonId);
    }
    setFilters(desktopDraft.filters);
    try {
      window.sessionStorage.setItem('scheduleActiveLeague', desktopDraft.filters.league);
    } catch {
      // Session storage may be unavailable.
    }
    closeDesktopFilters();
  };

  const openMobileFilters = () => {
    setMobileDraft({ seasonId: activeSeasonId, filters: { ...filters } });
    setMobileFilterView('ROOT');
    setMobileFiltersOpen(true);
  };

  const closeMobileFilters = () => {
    setMobileFilterView('ROOT');
    setMobileFiltersOpen(false);
  };

  const applyMobileFilters = () => {
    previousSeasonIdRef.current = mobileDraft.seasonId;
    if (mobileDraft.seasonId !== activeSeasonId) {
      setActiveSeason(mobileDraft.seasonId);
    }
    setFilters(mobileDraft.filters);
    try {
      window.sessionStorage.setItem('scheduleActiveLeague', mobileDraft.filters.league);
    } catch {
      // Session storage may be unavailable.
    }
    closeMobileFilters();
  };

  const selectMatch = (matchId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('match', matchId);
    setSearchParams(next, { replace: false });
  };

  const closeMatch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('match');
    setSearchParams(next, { replace: false });
  };

  const leagueSummary = filters.league === 'ALL' ? '全部級別' : filters.league;
  const desktopActiveFilterCount = Object.values(filters).filter((value) => value !== 'ALL').length;
  const desktopDraftFilterCount = Object.values(desktopDraft.filters).filter((value) => value !== 'ALL').length;
  const activeMobileFilterCount = Object.values(filters).filter((value) => value !== 'ALL').length;
  const mobileDraftFilterCount = Object.values(mobileDraft.filters).filter((value) => value !== 'ALL').length;

  const desktopDraftLeagueSummary = desktopDraft.filters.league === 'ALL'
    ? '全部級別'
    : desktopDraft.filters.league;
  const desktopDraftStatusSummary = getStatusSummary(desktopDraft.filters.status);
  const desktopDraftTeamSummary = desktopDraft.filters.team === 'ALL'
    ? '全部球隊'
    : desktopDraftSeasonData.teamMap[desktopDraft.filters.team]?.name ?? '全部球隊';
  const desktopDraftDateSummary = desktopDraft.filters.date === 'ALL'
    ? '全部日期'
    : desktopDraft.filters.date.replaceAll('-', '/');
  const desktopDraftRoundSummary = desktopDraft.filters.round === 'ALL'
    ? '全部輪次'
    : `第 ${desktopDraft.filters.round} 輪`;

  const mobileDraftLeagueSummary = mobileDraft.filters.league === 'ALL'
    ? '全部級別'
    : mobileDraft.filters.league;
  const mobileDraftStatusSummary = getStatusSummary(mobileDraft.filters.status);
  const mobileDraftTeamSummary = mobileDraft.filters.team === 'ALL'
    ? '全部球隊'
    : mobileDraftSeasonData.teamMap[mobileDraft.filters.team]?.name ?? '全部球隊';
  const mobileDraftDateSummary = mobileDraft.filters.date === 'ALL'
    ? '全部日期'
    : mobileDraft.filters.date.replaceAll('-', '/');
  const mobileDraftRoundSummary = mobileDraft.filters.round === 'ALL'
    ? '全部輪次'
    : `第 ${mobileDraft.filters.round} 輪`;

  const desktopSelectorConfig: FilterSelectorConfig | null = desktopFilterView === 'SEASON'
    ? {
        title: '選擇賽季',
        selectedValue: desktopDraft.seasonId,
        options: sortedSeasons.map((season) => ({ value: season.id, label: season.shortName })),
        onSelect: (value) => {
          const seasonId = value as SeasonId;
          if (seasonId === desktopDraft.seasonId) return;
          setDesktopDraft({ seasonId, filters: { ...EMPTY_FILTERS } });
        },
      }
    : desktopFilterView === 'LEAGUE'
      ? {
          title: '選擇聯賽級別',
          selectedValue: desktopDraft.filters.league,
          options: (['ALL', ...desktopDraftSeason.enabledLeagues] as LeagueFilter[]).map((league) => ({
            value: league,
            label: league === 'ALL' ? '全部級別' : league,
          })),
          onSelect: (value) => updateDesktopDraftFacet('league', value),
        }
      : desktopFilterView === 'STATUS'
        ? {
            title: '選擇比賽狀態',
            selectedValue: desktopDraft.filters.status,
            options: desktopDraftFacetOptions.statuses.map((status) => ({
              value: status,
              label: getStatusSummary(status),
            })),
            onSelect: (value) => updateDesktopDraftFacet('status', value),
          }
        : desktopFilterView === 'TEAM'
          ? {
              title: '選擇球隊',
              selectedValue: desktopDraft.filters.team,
              options: [
                { value: 'ALL', label: '全部球隊' },
                ...desktopDraftFacetOptions.teams.map((team) => ({ value: team.id, label: team.name })),
              ],
              onSelect: (value) => updateDesktopDraftFacet('team', value),
            }
          : desktopFilterView === 'DATE'
            ? {
                title: '選擇日期',
                selectedValue: desktopDraft.filters.date,
                options: [
                  { value: 'ALL', label: '全部日期' },
                  ...desktopDraftFacetOptions.dates.map((date) => ({ value: date, label: date.replaceAll('-', '/') })),
                ],
                onSelect: (value) => updateDesktopDraftFacet('date', value),
              }
            : desktopFilterView === 'ROUND'
              ? {
                  title: '選擇輪次',
                  selectedValue: desktopDraft.filters.round,
                  options: [
                    { value: 'ALL', label: '全部輪次' },
                    ...desktopDraftFacetOptions.rounds.map((round) => ({ value: round, label: `第 ${round} 輪` })),
                  ],
                  onSelect: (value) => updateDesktopDraftFacet('round', value),
                }
              : null;

  const mobileSelectorConfig: FilterSelectorConfig | null = mobileFilterView === 'SEASON'
    ? {
        title: '選擇賽季',
        selectedValue: mobileDraft.seasonId,
        options: sortedSeasons.map((season) => ({ value: season.id, label: season.shortName })),
        onSelect: (value) => {
          const seasonId = value as SeasonId;
          if (seasonId === mobileDraft.seasonId) return;
          setMobileDraft({ seasonId, filters: { ...EMPTY_FILTERS } });
        },
      }
    : mobileFilterView === 'LEAGUE'
      ? {
          title: '選擇聯賽級別',
          selectedValue: mobileDraft.filters.league,
          options: (['ALL', ...mobileDraftFacetOptions.leagueIds] as LeagueFilter[]).map((league) => ({
            value: league,
            label: league === 'ALL' ? '全部級別' : league,
          })),
          onSelect: (value) => updateMobileDraftFacet('league', value),
        }
      : mobileFilterView === 'STATUS'
        ? {
            title: '選擇比賽狀態',
            selectedValue: mobileDraft.filters.status,
            options: mobileDraftFacetOptions.statuses.map((status) => ({
              value: status,
              label: getStatusSummary(status),
            })),
            onSelect: (value) => updateMobileDraftFacet('status', value),
          }
        : mobileFilterView === 'TEAM'
          ? {
              title: '選擇球隊',
              selectedValue: mobileDraft.filters.team,
              options: [
                { value: 'ALL', label: '全部球隊' },
                ...mobileDraftFacetOptions.teams.map((team) => ({ value: team.id, label: team.name })),
              ],
              onSelect: (value) => updateMobileDraftFacet('team', value),
            }
          : mobileFilterView === 'DATE'
            ? {
                title: '選擇日期',
                selectedValue: mobileDraft.filters.date,
                options: [
                  { value: 'ALL', label: '全部日期' },
                  ...mobileDraftFacetOptions.dates.map((date) => ({ value: date, label: date.replaceAll('-', '/') })),
                ],
                onSelect: (value) => updateMobileDraftFacet('date', value),
              }
            : mobileFilterView === 'ROUND'
              ? {
                  title: '選擇輪次',
                  selectedValue: mobileDraft.filters.round,
                  options: [
                    { value: 'ALL', label: '全部輪次' },
                    ...mobileDraftFacetOptions.rounds.map((round) => ({ value: round, label: `第 ${round} 輪` })),
                  ],
                  onSelect: (value) => updateMobileDraftFacet('round', value),
                }
              : null;

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <SeasonPageHeader
          title="賽程與"
          accent="結果"
          showMobileSeasonSelector={false}
          showDesktopSeasonSelector={false}
          description={<div><span>{activeSeason.displayName} 比賽、結果與事件詳情</span></div>}
        />

        <button
          type="button"
          onClick={openMobileFilters}
          className="mb-5 flex min-h-12 w-full items-center justify-between border-y border-neutral-100 py-3 text-left md:hidden"
          aria-label={`開啟賽程篩選，目前顯示${leagueSummary}，共 ${filteredMatches.length} 場`}
        >
          <span className="flex items-center text-[13px] font-black text-brand-black">
            <Filter className="mr-2 h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
            篩選
            {activeMobileFilterCount > 0 && (
              <span className="ml-1.5 text-[11px] font-black text-brand-blue">
                {activeMobileFilterCount}
              </span>
            )}
          </span>
          <span className="flex items-center text-[11px] font-bold text-neutral-400">
            {activeSeason.shortName} · {leagueSummary} · {filteredMatches.length} 場
            <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>

        <div ref={desktopFilterRef} className="relative mb-8 hidden md:block">
          <div className="flex min-h-14 items-center justify-between border-y border-neutral-100">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-sm font-black tracking-wide text-brand-black">
                {filteredMatches.length} 場比賽
              </span>
              <span className="text-[11px] font-bold text-neutral-400">
                {activeSeason.shortName} · {leagueSummary}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleDesktopFilters}
              aria-expanded={desktopFiltersOpen}
              aria-controls="desktop-schedule-filters"
              className={`inline-flex min-h-11 items-center text-sm font-black transition-colors ${
                desktopFiltersOpen || desktopActiveFilterCount > 0
                  ? 'text-brand-blue'
                  : 'text-brand-black hover:text-brand-blue'
              }`}
            >
              <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
              篩選
              {desktopActiveFilterCount > 0 && (
                <span className="ml-1.5 text-xs font-black">{desktopActiveFilterCount}</span>
              )}
              <ChevronRight
                className={`ml-2 h-4 w-4 transition-transform ${desktopFiltersOpen ? '-rotate-90' : 'rotate-90'}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {desktopFiltersOpen && (
            <div
              id="desktop-schedule-filters"
              role="dialog"
              aria-label="篩選賽程"
              className="absolute right-0 top-[calc(100%+12px)] z-50 flex max-h-[min(70vh,620px)] w-[380px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
            >
              {desktopSelectorConfig ? (
                <>
                  <div className="grid shrink-0 grid-cols-[44px_1fr_44px] items-center border-b border-neutral-100 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => setDesktopFilterView('ROOT')}
                      className="flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:text-brand-black"
                      aria-label="返回篩選"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-center font-display text-base font-black text-brand-black">
                      {desktopSelectorConfig.title}
                    </h2>
                    <button
                      type="button"
                      onClick={closeDesktopFilters}
                      className="flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-brand-black"
                      aria-label="取消並關閉"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
                    {desktopSelectorConfig.options.map((option) => {
                      const selected = option.value === desktopSelectorConfig.selectedValue;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            desktopSelectorConfig.onSelect(option.value);
                            setDesktopFilterView('ROOT');
                          }}
                          className={`flex min-h-[52px] w-full items-center justify-between border-b border-neutral-100 text-left text-sm font-bold last:border-b-0 ${
                            selected ? 'text-brand-blue' : 'text-brand-black hover:text-brand-blue'
                          }`}
                        >
                          <span>{option.label}</span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected ? 'border-brand-blue' : 'border-neutral-300'
                            }`}
                            aria-hidden="true"
                          >
                            {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="shrink-0 border-b border-neutral-100 px-5 py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-lg font-black text-brand-black">篩選賽程</p>
                        <p className="mt-1 text-[11px] font-medium text-neutral-400">選擇要查看的比賽範圍</p>
                      </div>
                      <button
                        type="button"
                        onClick={closeDesktopFilters}
                        className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center text-neutral-400 transition-colors hover:text-brand-black"
                        aria-label="取消並關閉"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
                    {[
                      { label: '賽季', value: desktopDraftSeason.shortName, view: 'SEASON' as const },
                      { label: '聯賽級別', value: desktopDraftLeagueSummary, view: 'LEAGUE' as const },
                      { label: '比賽狀態', value: desktopDraftStatusSummary, view: 'STATUS' as const },
                      { label: '球隊', value: desktopDraftTeamSummary, view: 'TEAM' as const },
                      { label: '日期', value: desktopDraftDateSummary, view: 'DATE' as const },
                      { label: '輪次', value: desktopDraftRoundSummary, view: 'ROUND' as const },
                    ].map((field) => (
                      <button
                        key={field.label}
                        type="button"
                        onClick={() => setDesktopFilterView(field.view)}
                        className="flex min-h-[58px] w-full items-center border-b border-neutral-100 text-left last:border-b-0"
                      >
                        <span className="w-24 shrink-0 text-xs font-black text-neutral-500">{field.label}</span>
                        <span className="min-w-0 flex-1 truncate text-right text-sm font-bold text-brand-black">
                          {field.value}
                        </span>
                        <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
                      </button>
                    ))}
                  </div>

                  <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-neutral-100 bg-white px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setDesktopDraft((currentDraft) => ({
                        ...currentDraft,
                        filters: { ...EMPTY_FILTERS },
                      }))}
                      disabled={desktopDraftFilterCount === 0}
                      className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-black text-neutral-500 transition-colors hover:text-brand-black disabled:opacity-30 disabled:hover:text-neutral-500"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> 清除
                    </button>
                    <button
                      type="button"
                      onClick={applyDesktopFilters}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-black text-white transition-colors hover:bg-blue-800"
                    >
                      <Check className="mr-2 h-4 w-4" /> 顯示 {desktopDraftFilteredMatches.length} 場
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mb-20">
          {seasonData.matches.length === 0 ? (
            <EmptyState
              title={`${activeSeason.shortName} 賽程尚未公布`}
              description={`${activeSeason.shortName} 賽程將於球隊錄取及分級完成後公布`}
              showRegistrationLink={activeSeason.status === 'registration'}
            />
          ) : filteredMatches.length === 0 ? (
            <EmptyState title="沒有符合條件的賽事" description="請調整篩選條件後再查看" />
          ) : (
            <FullSchedule
              matches={filteredMatches}
              teamMap={seasonData.teamMap}
              onMatchClick={selectMatch}
              leagueFilter="ALL"
            />
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end md:hidden" role="dialog" aria-modal="true" aria-label="篩選賽程">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={closeMobileFilters}
            aria-label="取消並關閉篩選"
          />

          <div className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl">
            {mobileSelectorConfig ? (
              <>
                <div className="grid shrink-0 grid-cols-[44px_1fr_44px] items-center border-b border-neutral-100 px-2 py-2">
                  <button
                    type="button"
                    onClick={() => setMobileFilterView('ROOT')}
                    className="flex h-11 w-11 items-center justify-center text-neutral-500 active:text-brand-black"
                    aria-label="返回篩選"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-center font-display text-lg font-black text-brand-black">
                    {mobileSelectorConfig.title}
                  </h2>
                  <button
                    type="button"
                    onClick={closeMobileFilters}
                    className="flex h-11 w-11 items-center justify-center text-neutral-400 active:text-brand-black"
                    aria-label="取消並關閉"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
                  {mobileSelectorConfig.options.map((option) => {
                    const selected = option.value === mobileSelectorConfig.selectedValue;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          mobileSelectorConfig.onSelect(option.value);
                          setMobileFilterView('ROOT');
                        }}
                        className={`flex min-h-[54px] w-full items-center justify-between border-b border-neutral-100 text-left text-sm font-bold last:border-b-0 ${
                          selected ? 'text-brand-blue' : 'text-brand-black'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-brand-blue' : 'border-neutral-300'
                          }`}
                          aria-hidden="true"
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-3">
                  <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-neutral-200" aria-hidden="true" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xl font-black text-brand-black">篩選賽程</p>
                      <p className="mt-1 text-[11px] font-medium text-neutral-400">選擇要查看的比賽範圍</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeMobileFilters}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 transition-colors active:bg-neutral-100 active:text-brand-black"
                      aria-label="取消並關閉"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
                  {[
                    { label: '賽季', value: mobileDraftSeason.shortName, view: 'SEASON' as const },
                    { label: '聯賽級別', value: mobileDraftLeagueSummary, view: 'LEAGUE' as const },
                    { label: '比賽狀態', value: mobileDraftStatusSummary, view: 'STATUS' as const },
                    { label: '球隊', value: mobileDraftTeamSummary, view: 'TEAM' as const },
                    { label: '日期', value: mobileDraftDateSummary, view: 'DATE' as const },
                    { label: '輪次', value: mobileDraftRoundSummary, view: 'ROUND' as const },
                  ].map((field) => (
                    <button
                      key={field.label}
                      type="button"
                      onClick={() => setMobileFilterView(field.view)}
                      className="flex min-h-[58px] w-full items-center border-b border-neutral-100 text-left last:border-b-0"
                    >
                      <span className="w-20 shrink-0 text-xs font-black text-neutral-500">{field.label}</span>
                      <span className="min-w-0 flex-1 truncate text-right text-sm font-bold text-brand-black">
                        {field.value}
                      </span>
                      <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
                    </button>
                  ))}
                </div>

                <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-neutral-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                  <button
                    type="button"
                    onClick={() => setMobileDraft((currentDraft) => ({
                      ...currentDraft,
                      filters: { ...EMPTY_FILTERS },
                    }))}
                    disabled={mobileDraftFilterCount === 0}
                    className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-black text-neutral-500 disabled:opacity-30"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> 清除
                  </button>
                  <button
                    type="button"
                    onClick={applyMobileFilters}
                    className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-black text-white active:bg-blue-800"
                  >
                    <Check className="mr-2 h-4 w-4" /> 顯示 {mobileDraftFilteredMatches.length} 場
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <MatchDialog matchId={selectedMatchId} onClose={closeMatch} onSelectMatch={selectMatch} />
    </div>
  );
};

export default SchedulePage;
