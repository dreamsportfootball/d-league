import React, { useEffect, useMemo, useState } from 'react';
import { Filter, MousePointerClick, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import LeagueTabs from '../components/LeagueTabs';
import MatchDialog from '../components/MatchDialog';
import SeasonPageHeader from '../components/SeasonPageHeader';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import type { LeagueId } from '../types/season';

type LeagueFilter = LeagueId | 'ALL';
type StatusFilter = 'ALL' | 'UPCOMING' | 'FINISHED';

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

  const filterOptions: LeagueFilter[] = ['ALL', ...activeSeason.enabledLeagues];

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

        <LeagueTabs
          options={filterOptions}
          active={leagueTab}
          onChange={handleLeagueChange}
          getLabel={(tab) => tab === 'ALL' ? '全部' : activeSeason.leagues[tab]?.displayName ?? tab}
        />

        {seasonData.matches.length > 0 && (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center text-xs font-black uppercase tracking-widest text-brand-black">
                <Filter className="mr-2 h-4 w-4 text-brand-blue" /> 篩選賽程
              </div>
              <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center text-xs font-bold text-neutral-400 hover:text-brand-black">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> 清除
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="min-h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
                <option value="ALL">全部球隊</option>
                {availableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <select value={roundFilter} onChange={(event) => setRoundFilter(event.target.value)} className="min-h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
                <option value="ALL">全部輪次</option>
                {availableRounds.map((round) => <option key={round} value={round}>第 {round} 輪</option>)}
              </select>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="min-h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
                <option value="ALL">全部日期</option>
                {availableDates.map((date) => <option key={date} value={date}>{date.replaceAll('-', '/')}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="min-h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-brand-black">
                <option value="ALL">全部狀態</option>
                <option value="UPCOMING">即將開賽</option>
                <option value="FINISHED">已完賽</option>
              </select>
            </div>
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

      <MatchDialog matchId={selectedMatchId} onClose={closeMatch} onSelectMatch={selectMatch} />
    </div>
  );
};

export default SchedulePage;
