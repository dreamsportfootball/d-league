import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  MousePointerClick,
  RotateCcw,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import LeagueTabs from '../components/LeagueTabs';
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

interface MobileFilterDraft {
  seasonId: SeasonId;
  filters: ScheduleFilters;
}

interface FilterFieldsProps {
  availableTeams: SeasonTeam[];
  availableRounds: string[];
  availableDates: string[];
  availableStatuses: StatusFilter[];
  teamFilter: string;
  roundFilter: string;
  dateFilter: string;
  statusFilter: StatusFilter;
  setTeamFilter: (value: string) => void;
  setRoundFilter: (value: string) => void;
  setDateFilter: (value: string) => void;
  setStatusFilter: (value: StatusFilter) => void;
}

interface MobileSelectOption {
  value: string;
  label: string;
}

interface MobileSelectorConfig {
  title: string;
  selectedValue: string;
  options: MobileSelectOption[];
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

const FilterFields: React.FC<FilterFieldsProps> = ({
  availableTeams,
  availableRounds,
  availableDates,
  availableStatuses,
  teamFilter,
  roundFilter,
  dateFilter,
  statusFilter,
  setTeamFilter,
  setRoundFilter,
  setDateFilter,
  setStatusFilter,
}) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <label>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-neutral-400 md:hidden">球隊</span>
      <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
        <option value="ALL">全部球隊</option>
        {availableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select>
    </label>
    <label>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-neutral-400 md:hidden">輪次</span>
      <select value={roundFilter} onChange={(event) => setRoundFilter(event.target.value)} className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
        <option value="ALL">全部輪次</option>
        {availableRounds.map((round) => <option key={round} value={round}>第 {round} 輪</option>)}
      </select>
    </label>
    <label>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-neutral-400 md:hidden">日期</span>
      <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
        <option value="ALL">全部日期</option>
        {availableDates.map((date) => <option key={date} value={date}>{date.replaceAll('-', '/')}</option>)}
      </select>
    </label>
    <label>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-neutral-400 md:hidden">狀態</span>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
        <option value="ALL">全部狀態</option>
        {availableStatuses.includes('UPCOMING') && <option value="UPCOMING">即將開賽</option>}
        {availableStatuses.includes('FINISHED') && <option value="FINISHED">已完賽</option>}
      </select>
    </label>
  </div>
);

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFilterView, setMobileFilterView] = useState<MobileFilterView>('ROOT');
  const [mobileDraft, setMobileDraft] = useState<MobileFilterDraft>({
    seasonId: activeSeasonId,
    filters: { ...EMPTY_FILTERS },
  });

  const selectedMatchId = searchParams.get('match');
  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const facetOptions = useMemo(
    () => getFacetOptions(seasonData.matches, seasonData.teams, filters, activeSeason.enabledLeagues),
    [activeSeason.enabledLeagues, filters, seasonData.matches, seasonData.teams],
  );
  const filteredMatches = useMemo(
    () => seasonData.matches.filter((match) => matchPassesFilters(match, filters)),
    [filters, seasonData.matches],
  );

  const draftSeason = availableSeasons.find((season) => season.id === mobileDraft.seasonId) ?? activeSeason;
  const draftSeasonData = getSeasonData(mobileDraft.seasonId);
  const draftFacetOptions = useMemo(
    () => getFacetOptions(
      draftSeasonData.matches,
      draftSeasonData.teams,
      mobileDraft.filters,
      draftSeason.enabledLeagues,
    ),
    [draftSeason.enabledLeagues, draftSeasonData.matches, draftSeasonData.teams, mobileDraft.filters],
  );
  const draftFilteredMatches = useMemo(
    () => draftSeasonData.matches.filter((match) => matchPassesFilters(match, mobileDraft.filters)),
    [draftSeasonData.matches, mobileDraft.filters],
  );

  useEffect(() => {
    if (previousSeasonIdRef.current === activeSeasonId) return;
    previousSeasonIdRef.current = activeSeasonId;
    setFilters({ ...EMPTY_FILTERS });
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

  const updateAppliedFacet = (facet: FacetKey, value: string) => {
    if (filters[facet] === value) return;
    const proposedFilters = { ...filters, [facet]: value } as ScheduleFilters;
    const nextFilters = reconcileFilters(proposedFilters, facet, seasonData.matches);
    setFilters(nextFilters);

    if (facet === 'league') {
      try {
        window.sessionStorage.setItem('scheduleActiveLeague', nextFilters.league);
      } catch {
        // Session storage may be unavailable.
      }
    }
  };

  const updateDraftFacet = (facet: FacetKey, value: string) => {
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

  const resetFilters = () => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      team: 'ALL',
      round: 'ALL',
      date: 'ALL',
      status: 'ALL',
    }));
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

  const desktopLeagueOptions: LeagueFilter[] = ['ALL', ...activeSeason.enabledLeagues];
  const filterFieldProps: FilterFieldsProps = {
    availableTeams: facetOptions.teams,
    availableRounds: facetOptions.rounds,
    availableDates: facetOptions.dates,
    availableStatuses: facetOptions.statuses,
    teamFilter: filters.team,
    roundFilter: filters.round,
    dateFilter: filters.date,
    statusFilter: filters.status,
    setTeamFilter: (value) => updateAppliedFacet('team', value),
    setRoundFilter: (value) => updateAppliedFacet('round', value),
    setDateFilter: (value) => updateAppliedFacet('date', value),
    setStatusFilter: (value) => updateAppliedFacet('status', value),
  };
  const leagueSummary = filters.league === 'ALL' ? '全部級別' : filters.league;
  const activeMobileFilterCount = Object.values(filters).filter((value) => value !== 'ALL').length;
  const draftFilterCount = Object.values(mobileDraft.filters).filter((value) => value !== 'ALL').length;
  const draftLeagueSummary = mobileDraft.filters.league === 'ALL' ? '全部級別' : mobileDraft.filters.league;
  const draftStatusSummary = mobileDraft.filters.status === 'FINISHED'
    ? '已完賽'
    : mobileDraft.filters.status === 'UPCOMING'
      ? '即將開賽'
      : '全部狀態';
  const draftTeamSummary = mobileDraft.filters.team === 'ALL'
    ? '全部球隊'
    : draftSeasonData.teamMap[mobileDraft.filters.team]?.name ?? '全部球隊';
  const draftDateSummary = mobileDraft.filters.date === 'ALL'
    ? '全部日期'
    : mobileDraft.filters.date.replaceAll('-', '/');
  const draftRoundSummary = mobileDraft.filters.round === 'ALL'
    ? '全部輪次'
    : `第 ${mobileDraft.filters.round} 輪`;

  const mobileSelectorConfig: MobileSelectorConfig | null = mobileFilterView === 'SEASON'
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
          options: (['ALL', ...draftFacetOptions.leagueIds] as LeagueFilter[]).map((league) => ({
            value: league,
            label: league === 'ALL' ? '全部級別' : league,
          })),
          onSelect: (value) => updateDraftFacet('league', value),
        }
      : mobileFilterView === 'STATUS'
        ? {
            title: '選擇比賽狀態',
            selectedValue: mobileDraft.filters.status,
            options: draftFacetOptions.statuses.map((status) => ({
              value: status,
              label: status === 'FINISHED' ? '已完賽' : status === 'UPCOMING' ? '即將開賽' : '全部狀態',
            })),
            onSelect: (value) => updateDraftFacet('status', value),
          }
        : mobileFilterView === 'TEAM'
          ? {
              title: '選擇球隊',
              selectedValue: mobileDraft.filters.team,
              options: [
                { value: 'ALL', label: '全部球隊' },
                ...draftFacetOptions.teams.map((team) => ({ value: team.id, label: team.name })),
              ],
              onSelect: (value) => updateDraftFacet('team', value),
            }
          : mobileFilterView === 'DATE'
            ? {
                title: '選擇日期',
                selectedValue: mobileDraft.filters.date,
                options: [
                  { value: 'ALL', label: '全部日期' },
                  ...draftFacetOptions.dates.map((date) => ({ value: date, label: date.replaceAll('-', '/') })),
                ],
                onSelect: (value) => updateDraftFacet('date', value),
              }
            : mobileFilterView === 'ROUND'
              ? {
                  title: '選擇輪次',
                  selectedValue: mobileDraft.filters.round,
                  options: [
                    { value: 'ALL', label: '全部輪次' },
                    ...draftFacetOptions.rounds.map((round) => ({ value: round, label: `第 ${round} 輪` })),
                  ],
                  onSelect: (value) => updateDraftFacet('round', value),
                }
              : null;

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <SeasonPageHeader
          title="賽程與"
          accent="結果"
          showMobileSeasonSelector={false}
          description={
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <span>{activeSeason.displayName} 比賽、結果與事件詳情</span>
              {seasonData.matches.length > 0 && (
                <span className="flex items-center text-xs font-bold text-brand-blue md:ml-3">
                  <MousePointerClick className="mr-1.5 h-3 w-3 opacity-70" aria-hidden="true" />
                  點擊比賽查看詳情
                </span>
              )}
            </div>
          }
        />

        <div className="hidden md:block">
          <LeagueTabs
            options={desktopLeagueOptions}
            active={filters.league}
            onChange={(league) => updateAppliedFacet('league', league)}
            getLabel={(tab) => tab === 'ALL' ? '全部' : activeSeason.leagues[tab]?.displayName ?? tab}
          />
        </div>

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

        {seasonData.matches.length > 0 && (
          <div className="mb-8 hidden rounded-xl border border-neutral-200 bg-neutral-50 p-5 md:block">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center text-xs font-black uppercase tracking-widest text-brand-black">
                <Filter className="mr-2 h-4 w-4 text-brand-blue" /> 篩選賽程
              </div>
              <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center text-xs font-bold text-neutral-400 hover:text-brand-black">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> 清除
              </button>
            </div>
            <FilterFields {...filterFieldProps} />
          </div>
        )}

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
                    { label: '賽季', value: draftSeason.shortName, view: 'SEASON' as const },
                    { label: '聯賽級別', value: draftLeagueSummary, view: 'LEAGUE' as const },
                    { label: '比賽狀態', value: draftStatusSummary, view: 'STATUS' as const },
                    { label: '球隊', value: draftTeamSummary, view: 'TEAM' as const },
                    { label: '日期', value: draftDateSummary, view: 'DATE' as const },
                    { label: '輪次', value: draftRoundSummary, view: 'ROUND' as const },
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
                    disabled={draftFilterCount === 0}
                    className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-black text-neutral-500 disabled:opacity-30"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> 清除
                  </button>
                  <button
                    type="button"
                    onClick={applyMobileFilters}
                    className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-black text-white active:bg-blue-800"
                  >
                    <Check className="mr-2 h-4 w-4" /> 顯示 {draftFilteredMatches.length} 場
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
