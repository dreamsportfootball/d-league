import React, { useEffect, useMemo, useState } from 'react';
import { MousePointerClick, Trophy, X } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import MatchEvents from '../components/MatchEvents';
import { useSeason } from '../hooks/useSeason';
import type { LeagueId } from '../types/season';

type LeagueFilter = LeagueId | 'ALL';

const formatMatchDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const timePart = date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} ${timePart}`;
};

const isValidFilter = (value: string | null, enabledLeagues: LeagueId[]): value is LeagueFilter =>
  value === 'ALL' || enabledLeagues.includes(value as LeagueId);

const SchedulePage: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [leagueTab, setLeagueTab] = useState<LeagueFilter>(() => {
    try {
      const saved = window.sessionStorage.getItem('scheduleActiveLeague');
      return saved === 'ALL' || saved === 'L1' || saved === 'L2' || saved === 'L3' ? saved : 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidFilter(leagueTab, activeSeason.enabledLeagues)) {
      setLeagueTab('ALL');
    }
    setSelectedMatchId(null);
  }, [activeSeason.enabledLeagues, activeSeason.id, leagueTab]);

  useEffect(() => {
    document.body.style.overflow = selectedMatchId ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMatchId]);

  const selectedMatch = useMemo(
    () => seasonData.matches.find((match) => match.id === selectedMatchId),
    [seasonData.matches, selectedMatchId],
  );

  const filteredMatches = useMemo(
    () =>
      leagueTab === 'ALL'
        ? seasonData.matches
        : seasonData.matches.filter((match) => match.league === leagueTab),
    [leagueTab, seasonData.matches],
  );

  const handleLeagueChange = (league: LeagueFilter) => {
    setLeagueTab(league);
    setSelectedMatchId(null);
    try {
      window.sessionStorage.setItem('scheduleActiveLeague', league);
    } catch {
      // Session storage may be unavailable.
    }
  };

  const filterOptions: LeagueFilter[] = ['ALL', ...activeSeason.enabledLeagues];

  return (
    <div className="min-h-[80vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <div className="mb-4 flex flex-col justify-between md:mb-12 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:mb-4 md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
              完整 <span className="text-brand-blue">賽程</span>
            </h1>
            <div className="flex flex-col space-y-2 text-sm font-medium tracking-wide text-neutral-400 md:flex-row md:items-center md:space-y-0 md:text-base">
              <span>{activeSeason.displayName} 比賽、結果與事件詳情</span>
              {seasonData.matches.length > 0 && (
                <div className="ml-0 flex items-center text-xs font-bold text-brand-blue md:ml-4">
                  <MousePointerClick className="mr-1.5 h-3 w-3 opacity-70" aria-hidden="true" />
                  <span className="border-b border-brand-blue/50">點擊賽果看詳情</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h3 className="flex items-center font-display text-base font-bold uppercase tracking-wider text-neutral-900">
            <Trophy className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
            選擇聯賽
          </h3>
          <div className="flex space-x-4 text-xs font-bold">
            {filterOptions.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleLeagueChange(tab)}
                className={`whitespace-nowrap border-b-2 px-1 pb-1 transition-all ${
                  leagueTab === tab
                    ? 'border-brand-blue font-bold text-brand-black'
                    : 'border-transparent font-medium text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <span className="font-display md:hidden">{tab}</span>
                <span className="hidden md:inline">
                  {tab === 'ALL' ? 'ALL' : activeSeason.leagues[tab]?.displayName ?? tab}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-20">
          {seasonData.matches.length === 0 ? (
            <EmptyState
              title="2026/27 賽程尚未公布"
              description="2026/27 賽程將於球隊錄取及分級完成後公布"
              showRegistrationLink={activeSeason.status === 'registration'}
            />
          ) : filteredMatches.length === 0 ? (
            <EmptyState
              title="此級別尚無賽程"
              description={`${leagueTab} 賽程目前尚未公布`}
              showRegistrationLink={activeSeason.status === 'registration'}
            />
          ) : (
            <FullSchedule
              matches={seasonData.matches}
              teamMap={seasonData.teamMap}
              onMatchClick={(matchId) => setSelectedMatchId(matchId)}
              leagueFilter={leagueTab}
            />
          )}
        </div>
      </div>

      {selectedMatchId && selectedMatch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="關閉比賽詳情"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedMatchId(null)}
          />

          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative border-b border-neutral-100 bg-neutral-50 p-6">
              <button
                type="button"
                onClick={() => setSelectedMatchId(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-neutral-400 shadow-sm transition-colors hover:bg-neutral-100 hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-blue"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4 text-center">
                <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-blue">
                  {selectedMatch.league} • 第 {selectedMatch.round} 輪
                </span>
                <p className="mt-2 text-xs font-medium text-neutral-500">
                  {formatMatchDateTime(selectedMatch.timestamp)}
                </p>
              </div>

              {seasonData.teamMap[selectedMatch.homeTeamId] && seasonData.teamMap[selectedMatch.awayTeamId] && (
                <div className="flex items-center justify-between px-2 sm:px-8">
                  <div className="flex w-1/3 min-w-0 flex-col items-center">
                    <img
                      src={seasonData.teamMap[selectedMatch.homeTeamId].logo}
                      alt={seasonData.teamMap[selectedMatch.homeTeamId].name}
                      className="mb-3 h-16 w-16 object-contain sm:h-20 sm:w-20"
                    />
                    <h3 className="whitespace-nowrap text-center text-xs font-bold leading-tight tracking-tighter text-brand-black sm:text-lg">
                      {seasonData.teamMap[selectedMatch.homeTeamId].shortName}
                    </h3>
                  </div>

                  <div className="flex w-1/3 flex-col items-center">
                    <div className="font-display text-4xl font-black tracking-tight text-brand-black sm:text-6xl">
                      {selectedMatch.homeScore ?? '-'} - {selectedMatch.awayScore ?? '-'}
                    </div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Full Time</div>
                  </div>

                  <div className="flex w-1/3 min-w-0 flex-col items-center">
                    <img
                      src={seasonData.teamMap[selectedMatch.awayTeamId].logo}
                      alt={seasonData.teamMap[selectedMatch.awayTeamId].name}
                      className="mb-3 h-16 w-16 object-contain sm:h-20 sm:w-20"
                    />
                    <h3 className="whitespace-nowrap text-center text-xs font-bold leading-tight tracking-tighter text-brand-black sm:text-lg">
                      {seasonData.teamMap[selectedMatch.awayTeamId].shortName}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-grow overflow-y-auto bg-white">
              <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 py-3 text-center backdrop-blur">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Match Events</span>
              </div>
              <div className="px-4 pb-8">
                <MatchEvents matchId={selectedMatchId} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
