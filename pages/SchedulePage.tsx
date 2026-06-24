import React, { useEffect, useMemo, useState } from 'react';
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
import { MatchStatus } from '../types';
import type { LeagueId, SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';

type LeagueFilter = LeagueId | 'ALL';
type StatusFilter = 'ALL' | 'UPCOMING' | 'FINISHED';
type MobileFilterView = 'ROOT' | 'TEAM' | 'DATE' | 'ROUND';

interface FilterFieldsProps {
  availableTeams: SeasonTeam[];
  availableRounds: string[];
  availableDates: string[];
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

const FilterFields: React.FC<FilterFieldsProps> = ({
  availableTeams,
  availableRounds,
  availableDates,
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
        <option value="UPCOMING">即將開賽</option>
        <option value="FINISHED">已完賽</option>
      </select>
    </label>
  </div>
);

const isValidFilter = (value: string | null, enabledLeagues: LeagueId[]): value is LeagueFilter =>
  value === 'ALL' || enabledLeagues.includes(value as LeagueId);

const SchedulePage: React.FC = () => {
  const {
    activeSeasonId,
    activeSeason,
    seasonData,
    availableSeasons,
    setActiveSeason,
  } = useSeason();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leagueTab, setLeagueTab] = useState<LeagueFilter>(() => {
    try {
      const saved = window.sessionStorage.getItem('scheduleActiveLeague');
      return saved === 'ALL' || saved === 'L1' || saved === 'L2' || saved === 'L3' ? saved : 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [roundFilter, setRoundFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFilterView, setMobileFilterView] = useState<MobileFilterView>('ROOT');

  const selectedMatchId = searchParams.get('match');
  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );

  useEffect(() => {
    if (!isValidFilter(leagueTab, activeSeason.enabledLeagues)) setLeagueTab('ALL');
  }, [activeSeason.enabledLeagues, activeSeason.id, leagueTab]);

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

  const availableTeams = useMemo(
    () =>
      seasonData.teams
        .filter((team) => leagueTab === 'ALL' || team.leagueId === leagueTab)
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW')),
    [leagueTab, seasonData.teams],
  );

  const availableRounds = useMemo(
    () =>
      [...new Set(
        seasonData.matches
          .filter((match) => leagueTab === 'ALL' || match.league === leagueTab)
          .map((match) => String(match.round)),
      )].sort((a, b) => Number(a) - Number(b)),
    [leagueTab, seasonData.matches],
  );

  const availableDates = useMemo(
    () =>
      [...new Set(
        seasonData.matches
          .filter((match) => leagueTab === 'ALL' || match.league === leagueTab)
          .map((match) => match.timestamp.split('T')[0]),
      )].sort(),
    [leagueTab, seasonData.matches],
  );

  const filteredMatches = useMemo(
    () =>
      seasonData.matches.filter((match) => {
        if (leagueTab !== 'ALL' && match.league !== leagueTab) return false;
        if (teamFilter !== 'ALL' && match.homeTeamId !== teamFilter && match.awayTeamId !== teamFilter) return false;
        if (roundFilter !== 'ALL' && String(match.round) !== roundFilter) return false;
        if (dateFilter !== 'ALL' && !match.timestamp.startsWith(dateFilter)) return false;
        if (statusFilter === 'UPCOMING' && match.status !== MatchStatus.SCHEDULED) return false;
        if (statusFilter === 'FINISHED' && match.status !== MatchStatus.FINISHED) return false;
        return true;
      }),
    [dateFilter, leagueTab, roundFilter, seasonData.matches, statusFilter, teamFilter],
  );

  const activeMobileFilterCount = [teamFilter, roundFilter, dateFilter, statusFilter]
    .filter((value) => value !== 'ALL').length;

  const handleLeagueChange = (league: LeagueFilter) => {
    setLeagueTab(league);
    setTeamFilter('ALL');
    setRoundFilter('ALL');
    setDateFilter('ALL');
    try {
      window.sessionStorage.setItem('scheduleActiveLeague', league);
    } catch {
      // Session storage may be unavailable.
    }
  };

  const resetFilters = () => {
    setTeamFilter('ALL');
    setRoundFilter('ALL');
    setDateFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleSeasonChange = (seasonId: SeasonId) => {
    if (seasonId === activeSeasonId) return;
    setActiveSeason(seasonId);
    setLeagueTab('ALL');
    resetFilters();
    try {
      window.sessionStorage.setItem('scheduleActiveLeague', 'ALL');
    } catch {
      // Session storage may be unavailable.
    }
  };

  const openMobileFilters = () => {
    setMobileFilterView('ROOT');
    setMobileFiltersOpen(true);
  };

  const closeMobileFilters = () => {
    setMobileFilterView('ROOT');
    setMobileFiltersOpen(false);
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

  const filterOptions: LeagueFilter[] = ['ALL', ...activeSeason.enabledLeagues];
  const filterFieldProps: FilterFieldsProps = {
    availableTeams,
    availableRounds,
    availableDates,
    teamFilter,
    roundFilter,
    dateFilter,
    statusFilter,
    setTeamFilter,
    setRoundFilter,
    setDateFilter,
    setStatusFilter,
  };
  const leagueSummary = leagueTab === 'ALL' ? '全部級別' : leagueTab;
  const teamSummary = teamFilter === 'ALL'
    ? '全部球隊'
    : seasonData.teamMap[teamFilter]?.name ?? '全部球隊';
  const dateSummary = dateFilter === 'ALL' ? '全部日期' : dateFilter.replaceAll('-', '/');
  const roundSummary = roundFilter === 'ALL' ? '全部輪次' : `第 ${roundFilter} 輪`;

  const mobileSelectorConfig: MobileSelectorConfig | null = mobileFilterView === 'TEAM'
    ? {
        title: '選擇球隊',
        selectedValue: teamFilter,
        options: [
          { value: 'ALL', label: '全部球隊' },
          ...availableTeams.map((team) => ({ value: team.id, label: team.name })),
        ],
        onSelect: setTeamFilter,
      }
    : mobileFilterView === 'DATE'
      ? {
          title: '選擇日期',
          selectedValue: dateFilter,
          options: [
            { value: 'ALL', label: '全部日期' },
            ...availableDates.map((date) => ({ value: date, label: date.replaceAll('-', '/') })),
          ],
          onSelect: setDateFilter,
        }
      : mobileFilterView === 'ROUND'
        ? {
            title: '選擇輪次',
            selectedValue: roundFilter,
            options: [
              { value: 'ALL', label: '全部輪次' },
              ...availableRounds.map((round) => ({ value: round, label: `第 ${round} 輪` })),
            ],
            onSelect: setRoundFilter,
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
            options={filterOptions}
            active={leagueTab}
            onChange={handleLeagueChange}
            getLabel={(tab) => tab === 'ALL' ? '全部' : activeSeason.leagues[tab]?.displayName ?? tab}
          />
        </div>

        <div className="mb-3 flex items-center gap-6 border-b border-neutral-100 md:hidden" role="tablist" aria-label="選擇聯賽">
          {filterOptions.map((league) => {
            const selected = leagueTab === league;
            return (
              <button
                key={league}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleLeagueChange(league)}
                className={`flex min-h-11 shrink-0 items-center text-[13px] font-bold transition-colors ${
                  selected ? 'text-brand-black' : 'text-neutral-400'
                }`}
              >
                <span
                  className={`relative inline-flex pb-1 ${
                    selected
                      ? 'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-blue'
                      : ''
                  }`}
                >
                  {league === 'ALL' ? '全部' : league}
                </span>
              </button>
            );
          })}
        </div>

        {seasonData.matches.length > 0 && (
          <>
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
          </>
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
            aria-label="關閉篩選"
          />

          <div className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl">
            {mobileSelectorConfig ? (
              <>
                <div className="flex shrink-0 items-center border-b border-neutral-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setMobileFilterView('ROOT')}
                    className="flex h-11 w-11 items-center justify-center text-neutral-500 active:text-brand-black"
                    aria-label="返回篩選"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="ml-1 font-display text-lg font-black text-brand-black">
                    {mobileSelectorConfig.title}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
                  {mobileSelectorConfig.options.map((option) => {
                    const selected = option.value === mobileSelectorConfig.selectedValue;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          mobileSelectorConfig.onSelect(option.value);
                          setMobileFilterView('ROOT');
                        }}
                        className={`flex min-h-[52px] w-full items-center justify-between border-b border-neutral-100 text-left text-sm font-bold last:border-b-0 ${
                          selected ? 'text-brand-blue' : 'text-brand-black'
                        }`}
                      >
                        <span>{option.label}</span>
                        {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
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
                      aria-label="關閉"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5">
                  <section className="border-b border-neutral-100 py-5">
                    <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">賽季</h3>
                    <div className="flex items-center gap-6" role="radiogroup" aria-label="選擇賽季">
                      {sortedSeasons.map((season) => {
                        const selected = season.id === activeSeasonId;
                        return (
                          <button
                            key={season.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => handleSeasonChange(season.id)}
                            className={`min-h-11 shrink-0 text-sm font-bold transition-colors ${
                              selected ? 'text-brand-blue' : 'text-neutral-400'
                            }`}
                          >
                            <span
                              className={`relative inline-flex pb-1 ${
                                selected
                                  ? 'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-blue'
                                  : ''
                              }`}
                            >
                              {season.shortName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="border-b border-neutral-100 py-5">
                    <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">比賽狀態</h3>
                    <div className="flex items-center gap-6" role="radiogroup" aria-label="比賽狀態">
                      {([
                        ['ALL', '全部'],
                        ['FINISHED', '已完賽'],
                        ['UPCOMING', '即將開賽'],
                      ] as const).map(([value, label]) => {
                        const selected = statusFilter === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setStatusFilter(value)}
                            className={`min-h-11 shrink-0 text-sm font-bold transition-colors ${
                              selected ? 'text-brand-blue' : 'text-neutral-400'
                            }`}
                          >
                            <span
                              className={`relative inline-flex pb-1 ${
                                selected
                                  ? 'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-blue'
                                  : ''
                              }`}
                            >
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="py-2">
                    {[
                      { label: '球隊', value: teamSummary, view: 'TEAM' as const },
                      { label: '日期', value: dateSummary, view: 'DATE' as const },
                      { label: '輪次', value: roundSummary, view: 'ROUND' as const },
                    ].map((field) => (
                      <button
                        key={field.label}
                        type="button"
                        onClick={() => setMobileFilterView(field.view)}
                        className="flex min-h-[58px] w-full items-center border-b border-neutral-100 text-left last:border-b-0"
                      >
                        <span className="w-16 shrink-0 text-xs font-black text-neutral-500">{field.label}</span>
                        <span className="min-w-0 flex-1 truncate text-right text-sm font-bold text-brand-black">
                          {field.value}
                        </span>
                        <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
                      </button>
                    ))}
                  </section>
                </div>

                <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-neutral-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                  <button
                    type="button"
                    onClick={resetFilters}
                    disabled={activeMobileFilterCount === 0}
                    className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-black text-neutral-500 disabled:opacity-30"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> 清除
                  </button>
                  <button
                    type="button"
                    onClick={closeMobileFilters}
                    className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-black text-white active:bg-blue-800"
                  >
                    <Check className="mr-2 h-4 w-4" /> 顯示 {filteredMatches.length} 場
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
