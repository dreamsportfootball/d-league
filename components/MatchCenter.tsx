import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus, type Match } from '../types';
import type { SeasonTeam } from '../types/team';
import MatchEvents from './MatchEvents';

type MatchCenterFilter = 'Upcoming' | 'Results';

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

interface MatchCardProps {
  match: Match;
  teamMap: Record<string, SeasonTeam>;
  onClick: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, teamMap, onClick }) => {
  const homeTeam = teamMap[match.homeTeamId];
  const awayTeam = teamMap[match.awayTeamId];
  if (!homeTeam || !awayTeam) return null;

  const date = new Date(match.timestamp);
  const timeString = date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateString = `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleDateString('zh-TW', {
    weekday: 'short',
  })}`;

  const isLive = match.status === MatchStatus.LIVE;
  const isFinished = match.status === MatchStatus.FINISHED;
  const isClickable = isLive || isFinished;

  return (
    <button
      type="button"
      onClick={() => isClickable && onClick(match.id)}
      disabled={!isClickable}
      className={`group relative mr-3 flex w-[85vw] shrink-0 snap-center select-none flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-left shadow-sm transition-all duration-200 last:mr-0 md:mr-4 md:w-80 ${
        isClickable
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95'
          : 'cursor-default'
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-2">
        <div className="flex min-w-0 items-center">
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-neutral-500">
            {match.league} • 第{match.round}輪
          </span>
          <span className="ml-2 truncate border-l border-neutral-200 pl-2 text-xs font-medium text-neutral-400">
            {dateString}
          </span>
        </div>
        <span className={`ml-2 shrink-0 text-xs font-bold ${isLive ? 'animate-pulse text-red-500' : 'text-neutral-400'}`}>
          {isLive ? '進行中' : isFinished ? '完賽' : timeString}
        </span>
      </div>

      <div className="flex flex-grow flex-col justify-center p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center space-x-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <img src={homeTeam.logo} alt={homeTeam.name} className="h-8 w-8 object-contain drop-shadow-sm" />
              </div>
              <span className="whitespace-nowrap text-sm font-bold leading-tight tracking-tight text-brand-black md:text-lg">
                {homeTeam.shortName}
              </span>
            </div>
            <div className={`ml-2 shrink-0 font-display text-xl font-bold tabular-nums md:text-2xl ${isFinished || isLive ? 'text-brand-black' : 'text-neutral-300'}`}>
              {match.homeScore ?? '-'}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center space-x-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <img src={awayTeam.logo} alt={awayTeam.name} loading="lazy" className="h-8 w-8 object-contain drop-shadow-sm" />
              </div>
              <span className="whitespace-nowrap text-sm font-bold leading-tight tracking-tight text-brand-black md:text-lg">
                {awayTeam.shortName}
              </span>
            </div>
            <div className={`ml-2 shrink-0 font-display text-xl font-bold tabular-nums md:text-2xl ${isFinished || isLive ? 'text-brand-black' : 'text-neutral-300'}`}>
              {match.awayScore ?? '-'}
            </div>
          </div>
        </div>

        <div className="mt-5 flex shrink-0 items-center justify-between border-t border-neutral-100 pt-3 text-xs">
          {!isFinished && !isLive ? (
            <div className="flex min-w-0 items-center truncate font-medium text-neutral-400">
              <MapPin className="mr-1 h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{match.venue}</span>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center font-bold text-brand-blue group-hover:underline">
              查看比賽詳情 <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className="flex h-1.5 w-full shrink-0">
        <div className="w-1/2" style={{ backgroundColor: homeTeam.primaryColor }} />
        <div className="w-1/2" style={{ backgroundColor: awayTeam.primaryColor }} />
      </div>
    </button>
  );
};

const MatchCenter: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [filter, setFilter] = useState<MatchCenterFilter>('Results');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedMatchId(null);
    const hasFinished = seasonData.matches.some(
      (match) => match.status === MatchStatus.FINISHED || match.homeScore !== null,
    );
    setFilter(hasFinished ? 'Results' : 'Upcoming');
  }, [activeSeason.id, seasonData.matches]);

  useEffect(() => {
    document.body.style.overflow = selectedMatchId ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMatchId]);

  const filteredMatches = useMemo(() => {
    if (filter === 'Results') {
      const finished = seasonData.matches
        .filter((match) => match.status === MatchStatus.FINISHED || match.homeScore !== null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (finished.length === 0) return [];
      const lastMatchDate = finished[0].timestamp.split('T')[0];
      return finished
        .filter((match) => match.timestamp.startsWith(lastMatchDate))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    const scheduled = seasonData.matches
      .filter((match) => match.status === MatchStatus.SCHEDULED)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (scheduled.length === 0) return [];
    const nextMatchDate = scheduled[0].timestamp.split('T')[0];
    return scheduled.filter((match) => match.timestamp.startsWith(nextMatchDate));
  }, [filter, seasonData.matches]);

  const selectedMatch = useMemo(
    () => seasonData.matches.find((match) => match.id === selectedMatchId),
    [seasonData.matches, selectedMatchId],
  );

  const scroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });
  };

  const handleFilterChange = (nextFilter: MatchCenterFilter) => {
    setFilter(nextFilter);
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6 flex flex-col items-end justify-between md:flex-row">
            <div className="w-full md:w-auto">
              <div className="mb-2 flex items-baseline space-x-3">
                <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-brand-black [-webkit-text-stroke:.5px_currentColor] md:[-webkit-text-stroke:0px]">
                  賽事 <span className="text-brand-blue">中心</span>
                </h2>
              </div>
              <div className="flex w-full space-x-6 border-b border-neutral-100 md:w-auto">
                <button
                  type="button"
                  onClick={() => handleFilterChange('Results')}
                  className={`border-b-2 pb-2 text-sm font-bold uppercase transition-all duration-300 ${
                    filter === 'Results'
                      ? 'border-brand-black text-brand-black'
                      : 'border-transparent text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  本輪賽果
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('Upcoming')}
                  className={`border-b-2 pb-2 text-sm font-bold uppercase transition-all duration-300 ${
                    filter === 'Upcoming'
                      ? 'border-brand-black text-brand-black'
                      : 'border-transparent text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  即將開賽
                </button>
              </div>
            </div>

            <div className="mt-4 hidden items-center space-x-2 md:flex">
              <button type="button" onClick={() => scroll('left')} className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-black" aria-label="向左捲動">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scroll('right')} className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-black" aria-label="向右捲動">
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link to="/schedule" className="ml-4 flex items-center text-sm font-bold text-neutral-500 transition-colors hover:text-brand-black">
                完整賽程 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="group relative">
            <div
              ref={scrollContainerRef}
              className="no-scrollbar -mx-4 flex snap-x snap-proximity items-stretch overflow-x-auto px-4 pb-6 pt-1 scroll-smooth overscroll-x-contain touch-pan-x md:mx-0 md:px-0"
            >
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teamMap={seasonData.teamMap}
                    onClick={setSelectedMatchId}
                  />
                ))
              ) : (
                <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-12">
                  <CalendarDays className="mb-2 h-8 w-8 text-neutral-300" aria-hidden="true" />
                  <p className="text-sm font-medium text-neutral-400">
                    {seasonData.matches.length === 0
                      ? `${activeSeason.shortName} 賽程尚未公布`
                      : filter === 'Results'
                        ? '目前尚無完賽紀錄'
                        : '目前沒有即將進行的賽事'}
                  </p>
                </div>
              )}

              {filteredMatches.length > 0 && (
                <Link
                  to="/schedule"
                  className="group/more ml-4 mr-4 flex w-32 shrink-0 snap-center cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-100 bg-white shadow-sm transition-all hover:border-brand-blue hover:shadow-md active:scale-95"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover/more:bg-brand-blue group-hover/more:text-white">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase text-neutral-500 group-hover/more:text-brand-black">查看全部</span>
                </Link>
              )}
            </div>
            <div className="pointer-events-none absolute bottom-6 right-0 top-0 w-8 bg-gradient-to-l from-white to-transparent md:hidden" />
          </div>
        </div>
      </div>

      {selectedMatchId && selectedMatch && seasonData.teamMap[selectedMatch.homeTeamId] && seasonData.teamMap[selectedMatch.awayTeamId] && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          <button type="button" aria-label="關閉比賽詳情" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatchId(null)} />

          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative border-b border-neutral-100 bg-neutral-50 p-6">
              <button type="button" onClick={() => setSelectedMatchId(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-neutral-400 shadow-sm transition-colors hover:bg-neutral-100 hover:text-brand-black" aria-label="關閉">
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4 text-center">
                <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-blue">
                  {selectedMatch.league} • 第 {selectedMatch.round} 輪
                </span>
                <p className="mt-2 text-xs font-medium text-neutral-500">{formatMatchDateTime(selectedMatch.timestamp)}</p>
              </div>

              <div className="flex items-center justify-between px-2 sm:px-8">
                <div className="flex w-1/3 flex-col items-center">
                  <img src={seasonData.teamMap[selectedMatch.homeTeamId].logo} alt={seasonData.teamMap[selectedMatch.homeTeamId].name} className="mb-3 h-16 w-16 object-contain sm:h-20 sm:w-20" />
                  <h3 className="text-center font-bold leading-tight text-brand-black">{seasonData.teamMap[selectedMatch.homeTeamId].shortName}</h3>
                </div>

                <div className="flex w-1/3 flex-col items-center">
                  <div className="font-display text-4xl font-black tracking-tight text-brand-black sm:text-6xl">
                    {selectedMatch.homeScore ?? '-'} - {selectedMatch.awayScore ?? '-'}
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Full Time</div>
                </div>

                <div className="flex w-1/3 flex-col items-center">
                  <img src={seasonData.teamMap[selectedMatch.awayTeamId].logo} alt={seasonData.teamMap[selectedMatch.awayTeamId].name} className="mb-3 h-16 w-16 object-contain sm:h-20 sm:w-20" />
                  <h3 className="text-center font-bold leading-tight text-brand-black">{seasonData.teamMap[selectedMatch.awayTeamId].shortName}</h3>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto bg-white">
              <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 py-3 text-center backdrop-blur">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Match Events</span>
              </div>
              <div className="px-4 pb-8">
                <MatchEvents matchId={selectedMatchId} />
              </div>
            </div>

            <div className="border-t border-neutral-100 bg-neutral-50 p-4 text-center">
              <Link to="/schedule" className="text-xs font-bold uppercase tracking-widest text-brand-blue hover:text-brand-black">
                前往賽程頁面查看更多
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MatchCenter;
