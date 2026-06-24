import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
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
import type { LeagueId } from '../types/season';
import type { SeasonTeam } from '../types/team';

type LeagueFilter = LeagueId | 'ALL';
type StatusFilter = 'ALL' | 'UPCOMING' | 'FINISHED';

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
  const { activeSeason, seasonData } = useSeason();
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

  const selectedMatchId = searchParams.get('match');

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
      if (event.key === 'Escape') setMobileFiltersOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileFiltersOpen]);

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

  const activeMobileFilterCount = [leagueTab, teamFilter, roundFilter, dateFilter, statusFilter]
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

  const resetFilters = () => {
    setTeamFilter('ALL');
    setRoundFilter('ALL');
    setDateFilter('ALL');
    setStatusFilter('ALL');
  };

  const resetMobileFilters = () => {
    handleLeagueChange('ALL');
    setStatusFilter('ALL');
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

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <SeasonPageHeader
          title="賽程與"
          accent="結果"
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

        {seasonData.matches.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
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
                {leagueSummary} · {filteredMatches.length} 場
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
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="關閉篩選"
          />

          <div className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl">
            <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-3">
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-neutral-200" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xl font-black text-brand-black">篩選賽程</p>
                  <p className="mt-1 text-[11px] font-medium text-neutral-400">選擇要查看的比賽範圍</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 transition-colors active:bg-neutral-100 active:text-brand-black"
                  aria-label="關閉"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5">
              <section className="border-b border-neutral-100 py-5">
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">聯賽級別</h3>
                <div className="grid grid-cols-4" role="radiogroup" aria-label="聯賽級別">
                  {filterOptions.map((league) => {
                    const selected = leagueTab === league;
                    return (
                      <button
                        key={league}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleLeagueChange(league)}
                        className={`relative min-h-11 px-1 text-sm font-bold transition-colors ${
                          selected ? 'text-brand-blue' : 'text-neutral-400'
                        }`}
                      >
                        {league === 'ALL' ? '全部' : league}
                        <span
                          className={`absolute inset-x-3 bottom-0 h-0.5 ${selected ? 'bg-brand-blue' : 'bg-transparent'}`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="border-b border-neutral-100 py-5">
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">比賽狀態</h3>
                <div className="grid grid-cols-3" role="radiogroup" aria-label="比賽狀態">
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
                        className={`relative min-h-11 px-1 text-sm font-bold transition-colors ${
                          selected ? 'text-brand-blue' : 'text-neutral-400'
                        }`}
                      >
                        {label}
                        <span
                          className={`absolute inset-x-4 bottom-0 h-0.5 ${selected ? 'bg-brand-blue' : 'bg-transparent'}`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="py-2">
                {[
                  {
                    label: '球隊',
                    value: teamFilter,
                    onChange: setTeamFilter,
                    options: [
                      { value: 'ALL', label: '全部球隊' },
                      ...availableTeams.map((team) => ({ value: team.id, label: team.name })),
                    ],
                  },
                  {
                    label: '日期',
                    value: dateFilter,
                    onChange: setDateFilter,
                    options: [
                      { value: 'ALL', label: '全部日期' },
                      ...availableDates.map((date) => ({ value: date, label: date.replaceAll('-', '/') })),
                    ],
                  },
                  {
                    label: '輪次',
                    value: roundFilter,
                    onChange: setRoundFilter,
                    options: [
                      { value: 'ALL', label: '全部輪次' },
                      ...availableRounds.map((round) => ({ value: round, label: `第 ${round} 輪` })),
                    ],
                  },
                ].map((field) => (
                  <label key={field.label} className="relative flex min-h-[58px] items-center border-b border-neutral-100 last:border-b-0">
                    <span className="w-16 shrink-0 text-xs font-black text-neutral-500">{field.label}</span>
                    <select
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      className="h-11 min-w-0 flex-1 appearance-none border-0 bg-transparent pr-8 text-right text-sm font-bold text-brand-black outline-none"
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-neutral-300" aria-hidden="true" />
                  </label>
                ))}
              </section>
            </div>

            <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-neutral-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                onClick={resetMobileFilters}
                disabled={activeMobileFilterCount === 0}
                className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-black text-neutral-500 disabled:opacity-30"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> 清除
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-black text-white active:bg-blue-800"
              >
                <Check className="mr-2 h-4 w-4" /> 顯示 {filteredMatches.length} 場
              </button>
            </div>
          </div>
        </div>
      )}

      <MatchDialog matchId={selectedMatchId} onClose={closeMatch} onSelectMatch={selectMatch} />
    </div>
  );
};

export default SchedulePage;
